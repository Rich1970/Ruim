package nl.snelbel.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/** Snelbel: zoekveld + lijst (een webpagina uit de app zelf), contacten uit het adresboek, direct bellen. */
public class MainActivity extends Activity {
    private static final int REQ_CONTACTS = 1, REQ_CALL = 2;
    private WebView web;
    private boolean pageReady;
    private String pendingCall;
    private boolean freshSearch;
    static final String ACTION_SEARCH = "nl.snelbel.app.SEARCH";

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(getColor(R.color.bg));
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(), "SnelbelNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                if (scheme.equals("tel")) { call(uri.getSchemeSpecificPart()); return true; }
                if (scheme.equals("file")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception e) { /* geen app voor deze link */ }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                showKeyboard();
            }
        });
        web.loadUrl("file:///android_asset/index.html");
        if (!has(Manifest.permission.READ_CONTACTS)) requestPermissions(new String[]{Manifest.permission.READ_CONTACTS}, REQ_CONTACTS);
    }

    /** Geopend via de zoekbalk-widget: begin met een leeg zoekveld. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (ACTION_SEARCH.equals(intent.getAction())) freshSearch = true;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (pageReady) {
            web.evaluateJavascript("window.snelbelNativeResume&&window.snelbelNativeResume()", null);
            if (freshSearch) web.evaluateJavascript("window.snelbelNativeFresh&&window.snelbelNativeFresh()", null);
            freshSearch = false;
            showKeyboard();
        }
    }

    private boolean has(String permission) {
        return checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    /** Cursor in het zoekveld en toetsenbord in beeld, zonder dat er getikt hoeft te worden. */
    private void showKeyboard() {
        web.requestFocus();
        web.evaluateJavascript("(function(){var q=document.getElementById('q');if(q)q.focus();})()", null);
        final InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        for (int delay : new int[]{150, 500}) {
            web.postDelayed(new Runnable() {
                @Override public void run() { if (hasWindowFocus()) imm.showSoftInput(web, 0); }
            }, delay);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && pageReady) showKeyboard();
    }

    /** Belt direct. Zonder bel-toestemming vraagt Android die één keer; bij weigeren opent het belscherm. */
    private void call(String number) {
        if (number == null || number.trim().isEmpty()) return;
        if (has(Manifest.permission.CALL_PHONE)) {
            try { startActivity(new Intent(Intent.ACTION_CALL, Uri.fromParts("tel", number, null))); return; }
            catch (Exception e) { /* val terug op het belscherm */ }
            dial(number);
        } else {
            pendingCall = number;
            requestPermissions(new String[]{Manifest.permission.CALL_PHONE}, REQ_CALL);
        }
    }

    private void dial(String number) {
        try { startActivity(new Intent(Intent.ACTION_DIAL, Uri.fromParts("tel", number, null))); } catch (Exception e) { /* geen bel-app */ }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        if (code == REQ_CONTACTS) {
            web.evaluateJavascript("window.snelbelNativeReload&&window.snelbelNativeReload()", null);
        } else if (code == REQ_CALL && pendingCall != null) {
            String number = pendingCall;
            pendingCall = null;
            if (granted) call(number); else dial(number);
        }
    }

    private final class Bridge {
        @JavascriptInterface
        public boolean hasContactsAccess() { return has(Manifest.permission.READ_CONTACTS); }

        @JavascriptInterface
        public void askContactsAccess() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    if (shouldShowRequestPermissionRationale(Manifest.permission.READ_CONTACTS) || !has(Manifest.permission.READ_CONTACTS) && !askedBefore()) {
                        requestPermissions(new String[]{Manifest.permission.READ_CONTACTS}, REQ_CONTACTS);
                    } else {
                        // Android vraagt het niet meer: open de app-instellingen zodat de toestemming daar aan kan.
                        startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getPackageName(), null)));
                    }
                }
            });
        }

        @JavascriptInterface
        public String getContacts() {
            try { return readContacts().toString(); } catch (Exception e) { return "[]"; }
        }
    }

    private boolean askedBefore() {
        boolean before = getPreferences(MODE_PRIVATE).getBoolean("asked", false);
        getPreferences(MODE_PRIVATE).edit().putBoolean("asked", true).apply();
        return before;
    }

    private static final class Person {
        String first = "", last = "", org = "", li = "", mail = "", display = "";
        final JSONArray phones = new JSONArray();
        final Set<String> seen = new HashSet<>();
    }

    private static String str(Cursor c, int i) { String v = c.getString(i); return v == null ? "" : v.trim(); }

    private JSONArray readContacts() throws Exception {
        JSONArray out = new JSONArray();
        if (!has(Manifest.permission.READ_CONTACTS)) return out;
        final String NAME = ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE;
        final String PHONE = ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE;
        final String ORG = ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE;
        final String SITE = ContactsContract.CommonDataKinds.Website.CONTENT_ITEM_TYPE;
        final String MAIL = ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE;
        Map<Long, Person> people = new LinkedHashMap<>();
        String[] cols = {ContactsContract.Data.CONTACT_ID, ContactsContract.Data.MIMETYPE, ContactsContract.Data.DATA1,
                ContactsContract.Data.DATA2, ContactsContract.Data.DATA3, ContactsContract.Data.DATA5, ContactsContract.Data.DISPLAY_NAME};
        try (Cursor c = getContentResolver().query(ContactsContract.Data.CONTENT_URI, cols,
                ContactsContract.Data.MIMETYPE + " IN (?,?,?,?,?)", new String[]{NAME, PHONE, ORG, SITE, MAIL}, null)) {
            if (c == null) return out;
            while (c.moveToNext()) {
                long id = c.getLong(0);
                Person p = people.get(id);
                if (p == null) { p = new Person(); people.put(id, p); }
                String type = c.getString(1), d1 = str(c, 2);
                if (p.display.isEmpty()) p.display = str(c, 6);
                if (NAME.equals(type)) {
                    String given = str(c, 3), family = str(c, 4), middle = str(c, 5);
                    if (p.first.isEmpty() && p.last.isEmpty() && !(given + family).isEmpty()) {
                        p.first = middle.isEmpty() ? given : (given + " " + middle).trim();
                        p.last = family;
                    }
                } else if (PHONE.equals(type)) {
                    String key = d1.replaceAll("[^0-9+]", "");
                    if (!key.isEmpty() && p.seen.add(key)) {
                        int kind = c.getInt(3);
                        String label = kind == 2 || kind == 17 ? (kind == 2 ? "Mobiel" : "Werk mobiel") : kind == 3 ? "Werk" : kind == 1 ? "Thuis" : "Nummer";
                        p.phones.put(new JSONObject().put("l", label).put("v", d1));
                    }
                } else if (ORG.equals(type)) {
                    if (p.org.isEmpty()) p.org = d1;
                } else if (SITE.equals(type)) {
                    if (p.li.isEmpty() && d1.toLowerCase().contains("linkedin.com")) p.li = d1.matches("(?i)^https?://.*") ? d1 : "https://" + d1.replaceAll("^/+", "");
                } else if (MAIL.equals(type)) {
                    if (p.mail.isEmpty()) p.mail = d1;
                }
            }
        }
        for (Person p : people.values()) {
            if (p.phones.length() == 0) continue;
            if (p.first.isEmpty() && p.last.isEmpty() && !p.display.isEmpty() && !p.display.equals(p.org)) {
                int sp = p.display.indexOf(' ');
                p.first = sp < 0 ? p.display : p.display.substring(0, sp);
                p.last = sp < 0 ? "" : p.display.substring(sp + 1).trim();
            }
            if (p.first.isEmpty() && p.last.isEmpty() && p.org.isEmpty()) continue;
            out.put(new JSONObject().put("first", p.first).put("last", p.last).put("org", p.org)
                    .put("phones", p.phones).put("li", p.li).put("mail", p.mail));
        }
        return out;
    }
}
