package com.zhiwei.notebook;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_CODE_PICK_FOLDER = 9921;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // Handle downloads by delegating to system browser / download manager
                webView.setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setData(Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                        } catch (Exception ignored) {}
                    }
                });

                // Expose native bridge for SAF folder picker & system browser
                webView.addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void pickFolder() {
                        try {
                            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
                            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                            startActivityForResult(intent, REQUEST_CODE_PICK_FOLDER);
                        } catch (Exception ignored) {}
                    }

                    @JavascriptInterface
                    public void openInBrowser(String url) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                        } catch (Exception ignored) {}
                    }
                }, "AndroidNativeBridge");
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CODE_PICK_FOLDER && resultCode == Activity.RESULT_OK && data != null) {
            Uri treeUri = data.getData();
            if (treeUri != null) {
                String path = treeUri.getPath();
                if (path != null) {
                    if (path.contains("primary:")) {
                        path = path.substring(path.indexOf("primary:") + 8);
                    } else if (path.contains("document/")) {
                        path = path.substring(path.indexOf("document/") + 9);
                    }
                    final String cleanPath = path;
                    runOnUiThread(() -> {
                        try {
                            WebView webView = getBridge().getWebView();
                            if (webView != null) {
                                webView.evaluateJavascript(
                                    "if (window.onAndroidFolderSelected) { window.onAndroidFolderSelected('" + cleanPath.replace("'", "\\'") + "'); }",
                                    null
                                );
                            }
                        } catch (Exception ignored) {}
                    });
                }
            }
        }
    }
}
