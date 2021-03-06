package pt.lsts.ripples.services;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import okhttp3.HttpUrl;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import pt.lsts.ripples.domain.assets.ZerotierNode;
import pt.lsts.ripples.repo.main.ZerotierRepository;
import okhttp3.MediaType;
import okhttp3.RequestBody;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.json.JSONObject;
import org.json.JSONException;

@Service
public class ZerotierService {

    private final Logger logger = LoggerFactory.getLogger(ZerotierService.class);

    @Value("${zerotier.zt-central-url}")
    private String ZT_CENTRAL_URL;

    @Value("${zerotier.api-token}")
    private String apiToken;

    @Value("${zerotier.nwid}")
    private String nwid;

    private HttpUrl apiUrl;

    private OkHttpClient client;

    @Autowired
    private ZerotierRepository ztRepos;

    public static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    @PostConstruct
    public void init() {
        this.apiUrl = HttpUrl.parse(ZT_CENTRAL_URL);
        Interceptor interceptor = new ZerotierService.RequestInterceptor(apiToken);
        this.client = new OkHttpClient.Builder().addInterceptor(interceptor).build();
    }

    public Boolean joinNetwork(String nodeId, String username, String email) {
        final HttpUrl targetUrl = apiUrl.newBuilder().addPathSegment("network").addPathSegment(nwid)
                .addPathSegment("member").addPathSegment(nodeId).build();

        JSONObject nodeInfo = new JSONObject();
        try {
            // Operator information
            nodeInfo.put("name", username);
            nodeInfo.put("description", email);
            nodeInfo.put("hidden", false);
            // Auto-authorization
            JSONObject config = new JSONObject();
            config.put("authorized", true);
            nodeInfo.put("config", config);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        final RequestBody body = RequestBody.create(JSON, nodeInfo.toString());
        final Request request = new Request.Builder().url(targetUrl).post(body).build();
        JSONObject response = makeRequest(request);
        if (response != null) {
            ztRepos.save(new ZerotierNode(nodeId));
            logger.info("Node " + nodeId + " joined the Ripples Zerotier network!");
            return true;
        }
        return false;
    }

    public void leaveNetwork(String nodeId) {
        final HttpUrl targetUrl = apiUrl.newBuilder().addPathSegment("network").addPathSegment(nwid)
                .addPathSegment("member").addPathSegment(nodeId).build();
        final Request request = new Request.Builder().url(targetUrl).delete().build();
        try {
            client.newCall(request).execute();
        } catch (IOException e) {
            logger.error("Could not remove node of id %s!", nodeId);
        }
    }

    public void clearNodes() {
        logger.info("Cleansing temporary nodes from the Ripples network...");
        CompletableFuture.runAsync(() -> {
            List<ZerotierNode> nodes = ztRepos.findAll();
            for (ZerotierNode node : nodes) {
                leaveNetwork(node.getId());
            }
        }).thenRun(() -> {
            ztRepos.deleteAll();
        });
    }

    private JSONObject makeRequest(Request request) {
        JSONObject jsonResponse = null;
        try {
            Response response = client.newCall(request).execute();
            if (response.isSuccessful()) {
                jsonResponse = new JSONObject(response.body().string());
            } else {
                throw new IOException();
            }
        } catch (IOException e) {
            logger.error(e.getMessage());
        }
        return jsonResponse;
    }

    class RequestInterceptor implements Interceptor {
        private String apiToken;

        public RequestInterceptor(String apiToken) {
            this.apiToken = apiToken;
        }

        @Override
        public Response intercept(Chain chain) throws IOException {
            Request request = chain.request().newBuilder()
                    .addHeader("Authorization", String.format("Bearer %s", apiToken)).addHeader("X-ZT1-Auth", apiToken)
                    .build();
            return chain.proceed(request);
        }
    }
}