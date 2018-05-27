package pt.lsts.ripples.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import pt.lsts.ripples.domain.assets.Asset;
import pt.lsts.ripples.domain.assets.AssetInfo;
import pt.lsts.ripples.domain.assets.AssetPosition;
import pt.lsts.ripples.repo.AssetsRepository;
import pt.lsts.ripples.repo.PositionsRepository;
import pt.lsts.ripples.services.AssetInfoService;

@RestController
public class AssetsController {

    @Autowired
    AssetsRepository repo;

    @Autowired
    PositionsRepository positions;

    @Autowired
    AssetInfoService assetInfos;

    @PostMapping(
            path = {"/asset/{id}"},
            consumes = "application/json",
            produces = "application/json"
    )
    public Asset getAsset(@PathVariable String id, @RequestBody Asset asset) {
        Asset existing = repo.findById(id).orElse(new Asset(id));

        if (asset.getPlan() != null && asset.getPlan().getId() != null) {
            existing.setPlan(asset.getPlan());
        }

        if (asset.getLastState() != null) {
            existing.setLastState(asset.getLastState());

            AssetPosition pos = new AssetPosition();
            pos.setLat(asset.getLastState().getLatitude());
            pos.setLon(asset.getLastState().getLongitude());
            pos.setTimestamp(asset.getLastState().getDate());
            pos.setName(id);
            pos.setImcId(asset.getImcid());
            positions.save(pos);
        }

        repo.save(existing);
        return existing;
    }

    @RequestMapping(path = {"/asset", "/assets", "/assets/", "/asset/"}, method = RequestMethod.GET)
    public List<Asset> listAssets() {
        ArrayList<Asset> assets = new ArrayList<>();
        repo.findAll().forEach(assets::add);
        return assets;
    }
    
    @RequestMapping(path = {"/assetInfo"}, method = RequestMethod.GET)
    public List<AssetInfo> listAssetInfo() {
    	ArrayList<AssetInfo> assets = new ArrayList<>();
        assetInfos.getInfos().forEach(assets::add);
        return assets;
    }

}