param(
  [string]$Region = 'sa-east-1',
  [ValidateSet('felipe')][string]$Profile = 'felipe'
)
$ErrorActionPreference = 'Stop'
function Read-Aws([string[]]$Arguments) {
  $output = & aws @Arguments --profile $Profile --region $Region --output json
  if ($LASTEXITCODE -ne 0) { throw 'AWS command failed.' }
  return $output | ConvertFrom-Json
}
function Invoke-Aws([string[]]$Arguments) {
  & aws @Arguments --profile $Profile --region $Region
  if ($LASTEXITCODE -ne 0) { throw 'AWS command failed.' }
}
$identity = Read-Aws @('sts','get-caller-identity')
if ($identity.Account -ne '379443323181') { throw "Profile felipe must use AWS account 379443323181." }
$main = Read-Aws @('cloudformation','describe-stacks','--stack-name','fincheck-api-dev')
$apiId = ($main.Stacks[0].Outputs | Where-Object OutputKey -EQ 'HttpApiId').OutputValue
$bucket = ($main.Stacks[0].Outputs | Where-Object OutputKey -EQ 'ServerlessDeploymentBucketName').OutputValue
if (!$apiId -or !$bucket) { throw 'Existing API and deployment bucket are required.' }
$source = Read-Aws @('lambda','get-function-configuration','--function-name','fincheck-api-dev-listReceivables')
$authorizers = Read-Aws @('apigatewayv2','get-authorizers','--api-id',$apiId)
$authorizerId = ($authorizers.Items | Where-Object Name -EQ 'CognitoAuthorizer').AuthorizerId
if (!$authorizerId) { throw 'Existing JWT authorizer is required.' }
$root = '/entities/{entityId}'
$legacy = "$root/purchase-orders/{purchaseOrderId}/invoices"
$existingKeys = @("GET $legacy", "POST $legacy", "PATCH $legacy/{invoiceId}", "POST $legacy/{invoiceId}/payments", "PATCH $legacy/{invoiceId}/payments/{paymentId}", "GET $root/receivables", "GET $root/operations-dashboard")
$allRoutes = Read-Aws @('apigatewayv2','get-routes','--api-id',$apiId)
$existing = @($allRoutes.Items | Where-Object { $_.RouteKey -in $existingKeys })
if ($existing.Count -ne $existingKeys.Count) { throw 'The expected existing financial routes were not all found.' }
foreach ($route in $existing) {
  if ($route.AuthorizationType -ne 'JWT' -or $route.AuthorizerId -ne $authorizerId) { throw 'Unexpected route authorization; inspect before deploying.' }
}
& node scripts/buildFinancialModule.mjs
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
$revision = (& git rev-parse HEAD).Trim()
$zip = Join-Path (Get-Location) 'tmp/financial-module.zip'
Compress-Archive -LiteralPath 'tmp/financial-module-package/index.js' -DestinationPath $zip -Force
$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant().Substring(0,16)
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$releaseDirectory = Join-Path (Get-Location) "tmp/independent-invoices/releases/$stamp-$hash"
New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
$existing | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $releaseDirectory 'previous-routes.json') -Encoding utf8
$key = "financial-module/dev/$revision-$hash.zip"
Invoke-Aws @('s3','cp',$zip,"s3://$bucket/$key",'--only-show-errors')
$functionName = 'fincheck-api-dev-financialModule'
$resources = [ordered]@{
  FinancialLogs = @{ Type='AWS::Logs::LogGroup'; Properties=@{ LogGroupName="/aws/lambda/$functionName"; RetentionInDays=30 } }
  FinancialFunction = @{ Type='AWS::Lambda::Function'; DependsOn='FinancialLogs'; Properties=@{
    FunctionName=$functionName; Description="Independent invoices $revision $hash"; Handler='index.handler'; Runtime='nodejs22.x';
    MemorySize=512; Timeout=28; Role=$source.Role;
    Code=@{ S3Bucket=$bucket; S3Key=$key }; Environment=@{ Variables=$source.Environment.Variables }
  } }
  FinancialIntegration = @{ Type='AWS::ApiGatewayV2::Integration'; Properties=@{
    ApiId=$apiId; IntegrationType='AWS_PROXY'; IntegrationMethod='POST'; PayloadFormatVersion='2.0';
    IntegrationUri=@{ 'Fn::GetAtt'=@('FinancialFunction','Arn') }; TimeoutInMillis=29000
  } }
  FinancialPermission = @{ Type='AWS::Lambda::Permission'; Properties=@{
    Action='lambda:InvokeFunction'; FunctionName=@{ Ref='FinancialFunction' }; Principal='apigateway.amazonaws.com';
    SourceArn=@{ 'Fn::Sub'="arn:aws:execute-api:`${AWS::Region}:`${AWS::AccountId}:$apiId/*/*/entities/*" }
  } }
}
$invoicePath = "$root/invoices"
$newRoutes = @("GET $invoicePath", "POST $invoicePath", "PATCH $invoicePath/{invoiceId}", "POST $invoicePath/{invoiceId}/payments", "PATCH $invoicePath/{invoiceId}/payments/{paymentId}")
for ($i=0; $i -lt $newRoutes.Count; $i++) {
  $resources["InvoiceRoute$i"] = @{ Type='AWS::ApiGatewayV2::Route'; Properties=@{
    ApiId=$apiId; RouteKey=$newRoutes[$i]; AuthorizationType='JWT'; AuthorizerId=$authorizerId;
    Target=@{ 'Fn::Join'=@('/', @('integrations', @{ Ref='FinancialIntegration' })) }
  } }
}
$template = @{ AWSTemplateFormatVersion='2010-09-09'; Description='Additive independent invoice module; preserves the deployed SaaS stack'; Resources=$resources;
  Outputs=@{ FinancialIntegrationId=@{ Value=@{ Ref='FinancialIntegration' } }; FunctionName=@{ Value=@{ Ref='FinancialFunction' } } }
}
$templatePath = Join-Path $releaseDirectory 'stack.json'
[System.IO.File]::WriteAllText($templatePath, ($template | ConvertTo-Json -Depth 30), [System.Text.UTF8Encoding]::new($false))
# Secrets are kept in an ignored local template and the existing AWS account only.
Invoke-Aws @('cloudformation','deploy','--stack-name','fincheck-financial-module-dev','--template-file',$templatePath,'--no-fail-on-empty-changeset')
$deployed = Read-Aws @('cloudformation','describe-stacks','--stack-name','fincheck-financial-module-dev')
$integrationId = ($deployed.Stacks[0].Outputs | Where-Object OutputKey -EQ 'FinancialIntegrationId').OutputValue
if (!$integrationId) { throw 'Financial integration was not created.' }
# Move only these seven financial bindings. Existing Lambda code, teams and auth resources remain intact.
try {
  foreach ($route in $existing) {
    $null = Read-Aws @('apigatewayv2','update-route','--api-id',$apiId,'--route-id',$route.RouteId,'--target',"integrations/$integrationId")
  }
} catch {
  foreach ($route in $existing) { $null = Read-Aws @('apigatewayv2','update-route','--api-id',$apiId,'--route-id',$route.RouteId,'--target',$route.Target) }
  throw
}
$release = @{ revision=$revision; artifact=$key; sha256=$hash; apiId=$apiId; integrationId=$integrationId; functionName=$functionName; backupDirectory=$releaseDirectory; publishedAt=(Get-Date).ToUniversalTime().ToString('o') }
$release | ConvertTo-Json | Set-Content -LiteralPath 'tmp/independent-invoices/api-release.json' -Encoding utf8
Write-Output "Financial module published. All twelve routes retain the existing JWT authorizer. Backup: $releaseDirectory"
