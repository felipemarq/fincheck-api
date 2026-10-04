param(
  [string]$Region = 'sa-east-1',
  [string]$Stage = 'dev',
  [string]$MainStack = 'fincheck-api-dev'
)
$ErrorActionPreference = 'Stop'
function Read-AwsJson([string[]]$Arguments) {
  $output = & aws @Arguments --region $Region --output json
  if ($LASTEXITCODE -ne 0) { throw 'AWS command failed.' }
  return $output | ConvertFrom-Json
}
function Invoke-Aws([string[]]$Arguments) {
  & aws @Arguments --region $Region
  if ($LASTEXITCODE -ne 0) { throw 'AWS command failed.' }
}
$stack = Read-AwsJson @('cloudformation','describe-stacks','--stack-name',$MainStack)
$outputs = $stack.Stacks[0].Outputs
$apiId = ($outputs | Where-Object OutputKey -EQ 'HttpApiId').OutputValue
$bucket = ($outputs | Where-Object OutputKey -EQ 'ServerlessDeploymentBucketName').OutputValue
if (!$apiId -or !$bucket) { throw 'Main stack API and deployment bucket were not found.' }
$source = Read-AwsJson @('lambda','get-function-configuration','--function-name',"fincheck-api-$Stage-createSupplierPurchase")
$authorizers = Read-AwsJson @('apigatewayv2','get-authorizers','--api-id',$apiId)
$authorizer = ($authorizers.Items | Where-Object Name -EQ 'CognitoAuthorizer').AuthorizerId
if (!$authorizer) { throw 'The existing JWT authorizer was not found.' }
& node scripts/buildShoppingLists.mjs
if ($LASTEXITCODE -ne 0) { throw 'Lambda build failed.' }
$zipPath = Join-Path (Get-Location) 'tmp/shopping-lists.zip'
Compress-Archive -LiteralPath 'tmp/shopping-lists-package/index.js' -DestinationPath $zipPath -Force
$revision = (& git rev-parse HEAD).Trim()
$hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant().Substring(0,16)
$s3Key = "shopping-lists/$Stage/$revision-$hash.zip"
Invoke-Aws @('s3','cp',$zipPath,"s3://$bucket/$s3Key",'--only-show-errors')
$functionName = "fincheck-api-$Stage-shoppingLists"
$resources = [ordered]@{
  ShoppingListsLogGroup = @{ Type='AWS::Logs::LogGroup'; Properties=@{ LogGroupName="/aws/lambda/$functionName"; RetentionInDays=30 } }
  ShoppingListsFunction = @{ Type='AWS::Lambda::Function'; DependsOn='ShoppingListsLogGroup'; Properties=@{
    FunctionName=$functionName; Description="Shopping lists $revision"; Handler='index.handler'; Runtime='nodejs22.x';
    MemorySize=256; Timeout=28; Role=$source.Role;
    Code=@{ S3Bucket=$bucket; S3Key=$s3Key }; Environment=@{ Variables=$source.Environment.Variables }
  } }
  ShoppingListsIntegration = @{ Type='AWS::ApiGatewayV2::Integration'; Properties=@{
    ApiId=$apiId; IntegrationType='AWS_PROXY'; IntegrationMethod='POST'; PayloadFormatVersion='2.0';
    IntegrationUri=@{ 'Fn::GetAtt'=@('ShoppingListsFunction','Arn') }; TimeoutInMillis=29000
  } }
  ShoppingListsPermission = @{ Type='AWS::Lambda::Permission'; Properties=@{
    Action='lambda:InvokeFunction'; FunctionName=@{ Ref='ShoppingListsFunction' }; Principal='apigateway.amazonaws.com';
    SourceArn=@{ 'Fn::Sub'="arn:aws:execute-api:`${AWS::Region}:`${AWS::AccountId}:$apiId/*/*/entities/*/shopping-lists*" }
  } }
}
$root = '/entities/{entityId}/shopping-lists'
$listPath = "$root/{shoppingListId}"
$itemPath = "$listPath/items/{itemId}"
$routes = @("GET $root", "POST $root", "GET $listPath", "PATCH $listPath", "POST $listPath/items", "PUT $itemPath", "DELETE $itemPath", "PATCH $itemPath/check", "POST $itemPath/purchase")
for ($i=0; $i -lt $routes.Count; $i++) {
  $resources["ShoppingListsRoute$i"] = @{ Type='AWS::ApiGatewayV2::Route'; Properties=@{
    ApiId=$apiId; RouteKey=$routes[$i]; AuthorizationType='JWT'; AuthorizerId=$authorizer;
    Target=@{ 'Fn::Join'=@('/', @('integrations', @{ Ref='ShoppingListsIntegration' })) }
  } }
}
$template = @{ AWSTemplateFormatVersion='2010-09-09'; Description='Additive shopping-list module for the existing Fincheck API'; Resources=$resources }
$templatePath = Join-Path (Get-Location) 'tmp/shopping-lists-stack.json'
[System.IO.File]::WriteAllText($templatePath, ($template | ConvertTo-Json -Depth 30), [System.Text.UTF8Encoding]::new($false))
# Environment secrets remain in an ignored local file and the existing account's CloudFormation stack.
Invoke-Aws @('cloudformation','deploy','--stack-name',"fincheck-shopping-lists-$Stage",'--template-file',$templatePath,'--no-fail-on-empty-changeset')
Write-Output "Shopping lists deployed to the existing API ($apiId), without updating $MainStack."
