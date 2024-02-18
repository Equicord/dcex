import com.google.common.io.CharStreams;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.reandroid.apkeditor.merge.Merger;
import com.reandroid.commons.command.ARGException;
import org.apache.commons.io.FileUtils;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.gradle.api.DefaultTask;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;
import org.lsposed.patch.LSPatch;
import org.lsposed.patch.util.JavaLogger;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public abstract class VersionCheckTask extends DefaultTask {
  private String key;

  @Option(option = "key", description = "Keystore Key")
  void setKey(String key) {
    this.key = key;
  }

  @TaskAction
  public void checkVersion() throws IOException {
    try (final CloseableHttpClient client = HttpClients.createDefault()) {

      final HttpGet apkGet = new HttpGet("https://www.apkmirror.com/wp-content/themes/APKMirror/download.php?id=5814783&key=718fb8484a4dd462fe2f05990e90379cc265b769");
      apkGet.addHeader("User-Agent", "APKUpdater-v2.0.5");
      apkGet.addHeader("Authorization", "Basic YXBpLWFwa3VwZGF0ZXI6cm01cmNmcnVVakt5MDRzTXB5TVBKWFc4");
      final CloseableHttpResponse apkResponse = client.execute(apkGet);
      final File bundleFile = new File(System.getProperty("user.dir"), "bundle.apkm");
      FileUtils.copyInputStreamToFile(apkResponse.getEntity().getContent(), bundleFile);
      apkResponse.close();

      final File splitApkDir = new File(System.getProperty("user.dir"), "splits/");
      if (splitApkDir.exists()) {
        //noinspection ResultOfMethodCallIgnored
        splitApkDir.delete();
      }
      //noinspection ResultOfMethodCallIgnored
      splitApkDir.mkdirs();
      final byte[] zipBuf = new byte[1024];
      final ZipInputStream zis = new ZipInputStream(new FileInputStream(bundleFile));

      ZipEntry zipEntry = zis.getNextEntry();
      while (zipEntry != null) {
        if (zipEntry.getName().endsWith(".apk")) {
          final File mvdFile = new File(splitApkDir, zipEntry.getName());
          final FileOutputStream fos = new FileOutputStream(mvdFile);
          int len;
          while ((len = zis.read(zipBuf)) > 0) {
            fos.write(zipBuf, 0, len);
          }
          fos.close();
        }
        zipEntry = zis.getNextEntry();
      }

      zis.closeEntry();
      zis.close();

    }

    final String mergedPath = new File(System.getProperty("user.dir"), "merged.apk").getAbsolutePath();

    try {
      Merger.execute(new String[]{"-i", new File(System.getProperty("user.dir"), "splits/").getAbsolutePath(), "-o", mergedPath});
    } catch (ARGException e) {
      throw new RuntimeException(e);
    }

    final String modPath = new File(System.getProperty("user.dir"), "app/build/outputs/apk/debug/app-debug.apk").getAbsolutePath();
    final String jksPath = new File(System.getProperty("user.dir"), "github.jks").getAbsolutePath();
    final String outPath = new File(System.getProperty("user.dir"), "patchapk/").getAbsolutePath();

    new LSPatch(new JavaLogger(), mergedPath, "--force", "-m", modPath, "-o", outPath, "-k", jksPath, key, "discordex", key).doCommandLine();
  }
}