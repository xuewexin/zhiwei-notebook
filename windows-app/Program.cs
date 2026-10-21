using System;
using System.IO;
using System.IO.Compression;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Drawing;
using System.Diagnostics;

namespace ZhiWeiNote;

static class Program
{
    [STAThread]
    static void Main()
    {
        try
        {
            ApplicationConfiguration.Initialize();
            Application.Run(new MainForm());
        }
        catch (Exception ex)
        {
            Console.WriteLine("CRASH: " + ex);
        }
    }
}

public class MainForm : Form
{
    private WebView2 _webView = null!;
    private Process? _serverProcess;

    public MainForm()
    {
        InitializeComponents();
        StartLocalServerIfAvailable();
        InitializeWebView();
    }

    private void InitializeComponents()
    {
        Text = "知微错题本 - 见微知著 · 省思改错";
        Size = new Size(1360, 860);
        MinimumSize = new Size(860, 600);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(248, 250, 252);

        try
        {
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? null;
        }
        catch {}

        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = Color.FromArgb(248, 250, 252)
        };

        Controls.Add(_webView);

        FormClosing += (s, e) =>
        {
            try
            {
                if (_serverProcess != null && !_serverProcess.HasExited)
                {
                    _serverProcess.Kill(true);
                }
            }
            catch {}
        };
    }

    private void StartLocalServerIfAvailable()
    {
        try
        {
            // Check if server/index.js exists nearby
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string serverPath = Path.Combine(baseDir, "server", "index.js");
            if (!File.Exists(serverPath))
            {
                serverPath = Path.Combine(baseDir, "..", "server", "index.js");
            }

            if (File.Exists(serverPath))
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"\"{Path.GetFullPath(serverPath)}\"",
                    WorkingDirectory = Path.GetDirectoryName(Path.GetFullPath(serverPath))!,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                _serverProcess = Process.Start(psi);
            }
        }
        catch
        {
            // Outside node environment, fallback to standalone IndexedDB client mode
        }
    }

    private async void InitializeWebView()
    {
        try
        {
            string userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ZhiWeiNote",
                "WebView2Data"
            );
            Directory.CreateDirectory(userDataFolder);

            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await _webView.EnsureCoreWebView2Async(env);

            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
            _webView.CoreWebView2.Settings.IsZoomControlEnabled = true;

            // Register native host bridge for folder dialog & browser launching
            _webView.CoreWebView2.AddHostObjectToScript("nativeHost", new NativeHostBridge(this));

            // Intercept external window requests to launch default browser
            _webView.CoreWebView2.NewWindowRequested += (s, e) =>
            {
                e.Handled = true;
                try
                {
                    Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true });
                }
                catch {}
            };

            // Allow downloads to trigger smoothly
            _webView.CoreWebView2.DownloadStarting += (s, e) =>
            {
                e.Handled = false;
            };

            // 1. Always extract and prioritize the fresh embedded web bundle from the executable
            string bundleDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ZhiWeiNote",
                "Bundle_v167"
            );

            string distPath = "";

            try
            {
                Directory.CreateDirectory(bundleDir);
                using var stream = typeof(Program).Assembly.GetManifestResourceStream("ZhiWeiNote.dist.zip");
                if (stream != null)
                {
                    using var archive = new System.IO.Compression.ZipArchive(stream);
                    archive.ExtractToDirectory(bundleDir, true);
                    if (File.Exists(Path.Combine(bundleDir, "index.html")))
                    {
                        distPath = bundleDir;
                    }
                }
            }
            catch {}

            // 2. Fallback to nearby dist directory if running in local development mode
            if (string.IsNullOrEmpty(distPath) || !File.Exists(Path.Combine(distPath, "index.html")))
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string localDist = Path.Combine(baseDir, "dist");
                if (File.Exists(Path.Combine(localDist, "index.html")))
                {
                    distPath = localDist;
                }
                else if (File.Exists(Path.Combine(baseDir, "..", "dist", "index.html")))
                {
                    distPath = Path.Combine(baseDir, "..", "dist");
                }
            }

            if (Directory.Exists(distPath))
            {
                string fullDistPath = Path.GetFullPath(distPath);
                _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "zhiwei.app",
                    fullDistPath,
                    CoreWebView2HostResourceAccessKind.Allow
                );

                _webView.CoreWebView2.Navigate("https://zhiwei.app/index.html");
            }
            else
            {
                // Fallback to local dev server or show message
                _webView.CoreWebView2.Navigate("http://localhost:5173");
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"启动 WebView2 失败: {ex.Message}\n请确保已安装 Microsoft Edge WebView2 Runtime。",
                "知微错题本",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }
}

[System.Runtime.InteropServices.ComVisible(true)]
public class NativeHostBridge
{
    private readonly Form _parent;

    public NativeHostBridge(Form parent)
    {
        _parent = parent;
    }

    public string PickFolder(string initialPath = "")
    {
        string selected = "";
        try
        {
            _parent.Invoke(new Action(() =>
            {
                using var dialog = new FolderBrowserDialog();
                dialog.Description = "请选择知微错题本的数据与备份存放目录";
                dialog.UseDescriptionForTitle = true;
                dialog.ShowNewFolderButton = true;
                if (!string.IsNullOrEmpty(initialPath) && Directory.Exists(initialPath))
                {
                    dialog.InitialDirectory = initialPath;
                }
                if (dialog.ShowDialog(_parent) == DialogResult.OK)
                {
                    selected = dialog.SelectedPath;
                }
            }));
        }
        catch {}
        return selected;
    }

    public void OpenUrl(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch {}
    }
}
