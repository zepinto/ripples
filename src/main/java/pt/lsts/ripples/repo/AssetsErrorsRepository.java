package pt.lsts.ripples.repo;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import pt.lsts.ripples.domain.assets.AssetError;

@Repository
public interface AssetsErrorsRepository extends CrudRepository<AssetError, String> {
}