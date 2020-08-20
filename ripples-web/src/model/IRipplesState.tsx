import IAisShip, { IShipLocation } from './IAisShip'
import IAnnotation from './IAnnotations'
import IAsset from './IAsset'
import IUserState, { IUserLocation } from './IAuthState'
import ILatLng from './ILatLng'
import IOverlayInfo from './IOverlayInfo'
import IPlan from './IPlan'
import IProfile from './IProfile'
import { ToolSelected } from './ToolSelected'
import { WeatherParam } from './WeatherParam'
import IGeoLayer from './IGeoLayer'

export interface IAssetsGroup {
  vehicles: IAsset[]
  spots: IAsset[]
  aisShips: IAisShip[]
  aisDrawableLocations: IShipLocation[]
  ccus: IAsset[]
}

export default interface IRipplesState {
  assets: IAssetsGroup
  selectedPlan: IPlan
  sliderValue: number
  selectedWaypointIdx: number
  auth: IUserState
  profiles: IProfile[]
  planSet: IPlan[]
  previousPlanSet: IPlan[]
  toolSelected: ToolSelected
  isGpsActive: boolean
  vehicleSelected: string
  sidePanelTitle: string
  sidePanelContent: any
  isSidePanelVisible: boolean
  measurePath: ILatLng[]
  annotations: IAnnotation[]
  usersLocations: IUserLocation[]
  isVehicleModalOpen: boolean
  editVehicle?: IAsset
  hasSliderChanged: boolean
  mapOverlayInfo: IOverlayInfo
  weatherParam: WeatherParam | null
  toolClickLocation: ILatLng | null
  geoLayers: IGeoLayer[] | null
  isEditingPlan: boolean
}

export const defaultAssetsGroup: IAssetsGroup = {
  aisDrawableLocations: [],
  aisShips: [],
  spots: [],
  vehicles: [],
  ccus: [],
}
