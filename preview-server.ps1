param(
  [int]$Port = 5173
)

$Root = $PSScriptRoot
$Prefix = "http://127.0.0.1:$Port/"
$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".jsx"  = "text/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg"  = "image/svg+xml"
  ".webp" = "image/webp"
}

$Listener = [System.Net.HttpListener]::new()
$Listener.Prefixes.Add($Prefix)
$Listener.Start()
Write-Host "Serving $Root at $Prefix"

while ($Listener.IsListening) {
  try {
    $Context = $Listener.GetContext()
    $RequestPath = [Uri]::UnescapeDataString($Context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($RequestPath)) {
      $RequestPath = "Wedding Landing.html"
    }

    $FullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $RequestPath))
    if (-not $FullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $Context.Response.StatusCode = 403
      $Bytes = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
    } elseif (Test-Path -LiteralPath $FullPath -PathType Leaf) {
      $Bytes = [System.IO.File]::ReadAllBytes($FullPath)
      $Ext = [System.IO.Path]::GetExtension($FullPath).ToLowerInvariant()
      $Context.Response.ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
      $Context.Response.StatusCode = 200
    } else {
      $Context.Response.StatusCode = 404
      $Bytes = [System.Text.Encoding]::UTF8.GetBytes("Not found")
    }

    $Context.Response.ContentLength64 = $Bytes.Length
    $Context.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
    $Context.Response.OutputStream.Close()
  } catch {
    if ($Context -and $Context.Response) {
      $Context.Response.StatusCode = 500
      $Context.Response.Close()
    }
  }
}
