import React, { Component } from 'react'
import 'react-notifications/lib/notifications.css'
const { NotificationManager } = require('react-notifications')
import { connect } from 'react-redux'
import IAisShip from '../../model/IAisShip'
import IAsset from '../../model/IAsset'
import UserState, { isScientist, IUser } from '../../model/IAuthState'
import IPlan from '../../model/IPlan'
import IProfile from '../../model/IProfile'
import IRipplesState from '../../model/IRipplesState'
import {
  addNewPlan,
  cancelEditPlan,
  editPlan,
  savePlan,
  setAis,
  setPlans,
  setProfiles,
  setSlider,
  setSpots,
  setUser,
  setVehicles,
} from '../../redux/ripples.actions'
import { fetchAisData } from '../../services/AISUtils'
import { getCurrentUser } from '../../services/AuthUtils'
import { timestampMsToReadableDate } from '../../services/DateUtils'
import {
  deleteUnassignedPlan,
  fetchAwareness,
  fetchProfileData,
  fetchSoiData,
  fetchUnassignedPlans,
  mergeAssetSettings,
  sendPlanToVehicle,
  sendUnassignedPlan,
  updatePlanId,
} from '../../services/SoiUtils'
import RipplesMap from './components/RipplesMap'
import SidePanel from './components/SidePanel'
import Slider from './components/Slider'
import TopNav from './components/TopNav'
import './styles/Ripples.css'

interface StateType {
  loading: boolean
}

interface PropsType {
  plans: IPlan[]
  setVehicles: (_: IAsset[]) => void
  setSpots: (_: IAsset[]) => void
  setAis: (_: IAisShip[]) => void
  setPlans: (_: IPlan[]) => void
  setSlider: (_: number) => void
  editPlan: (_: IPlan) => void
  addNewPlan: (_: IPlan) => void
  setProfiles: (profiles: IProfile[]) => any
  setUser: (user: IUser) => any
  savePlan: () => void
  cancelEditPlan: () => void
  selectedPlan: IPlan
  sliderValue: number
  auth: UserState
  vehicleSelected: string
}

class Ripples extends Component<PropsType, StateType> {
  public soiTimer: number = 0
  public aisTimer: number = 0

  public freedrawRef = React.createRef()

  constructor(props: any) {
    super(props)
    this.state = {
      loading: true,
    }
    this.handleCancelEditPlan = this.handleCancelEditPlan.bind(this)
    this.handleEditPlan = this.handleEditPlan.bind(this)
    this.handleStartNewPlan = this.handleStartNewPlan.bind(this)
    this.handleSavePlan = this.handleSavePlan.bind(this)
    this.handleDeletePlan = this.handleDeletePlan.bind(this)
    this.onSliderChange = this.onSliderChange.bind(this)
    this.handleSendPlanToVehicle = this.handleSendPlanToVehicle.bind(this)
    this.handleUpdatePlanId = this.handleUpdatePlanId.bind(this)
    this.stopUpdates = this.stopUpdates.bind(this)
    this.startUpdates = this.startUpdates.bind(this)
    this.updateSoiData = this.updateSoiData.bind(this)
    this.updateAISData = this.updateAISData.bind(this)
    this.loadCurrentlyLoggedInUser = this.loadCurrentlyLoggedInUser.bind(this)
  }

  public async loadCurrentlyLoggedInUser() {
    try {
      const user: IUser = await getCurrentUser()
      this.props.setUser(user)
      NotificationManager.info(`${user.role.toLowerCase()}: ${user.email}`)
    } catch (error) {
      localStorage.removeItem('ACCESS_TOKEN')
    }
  }

  public async componentDidMount() {
    await this.loadCurrentlyLoggedInUser()
    this.setState({ loading: false })
    this.startUpdates()
  }

  public stopUpdates() {
    clearInterval(this.soiTimer)
    clearInterval(this.aisTimer)
  }

  public startUpdates() {
    this.updateSoiData()
    this.updateAISData()
    if (!this.soiTimer) {
      this.soiTimer = window.setInterval(this.updateSoiData, 60000)
    }
    if (!this.aisTimer) {
      this.aisTimer = window.setInterval(this.updateAISData, 60000) // get ais data every minute
    }
  }

  public componentWillUnmount() {
    clearInterval(this.soiTimer)
    clearInterval(this.aisTimer)
  }

  public async updateSoiData() {
    try {
      const soiPromise = fetchSoiData()
      const profilesPromise = fetchProfileData()
      const awarenessPromise = fetchAwareness()
      let unassignedPlansPromise
      if (isScientist(this.props.auth)) {
        unassignedPlansPromise = fetchUnassignedPlans()
      }
      const soiData = await soiPromise
      const vehicles = soiData.vehicles
      await mergeAssetSettings(vehicles, this.props.auth)

      // fetch profiles
      let profiles = await profilesPromise
      profiles = profiles.filter(p => p.samples.length > 0)
      this.props.setProfiles(profiles)

      // fetch soi awareness
      const assetsAwareness = await awarenessPromise
      assetsAwareness.forEach(assetAwareness => {
        const vehicle = vehicles.find(v => v.name === assetAwareness.name)
        if (vehicle) {
          vehicle.awareness = assetAwareness.positions
        }
      })

      if (unassignedPlansPromise) {
        const unassignedPlans: IPlan[] = await unassignedPlansPromise
        soiData.plans = soiData.plans.concat(unassignedPlans)
      }
      // update redux store
      this.props.setVehicles(soiData.vehicles)
      this.props.setSpots(soiData.spots)
      this.props.setPlans(soiData.plans)
    } catch (error) {
      NotificationManager.warning('Failed to fetch data')
    }
  }

  public async updateAISData() {
    const shipsData: IAisShip[] = await fetchAisData()
    // update redux store
    this.props.setAis(shipsData)
  }

  public handleEditPlan = (p: IPlan) => {
    this.props.editPlan(p)
    this.stopUpdates()
  }

  public handleStartNewPlan = (planId: string) => {
    const plan: IPlan = {
      assignedTo: '',
      description: `Plan created by ${this.props.auth.currentUser.email} on ${timestampMsToReadableDate(Date.now())}`,
      id: planId,
      waypoints: [],
    }
    this.props.addNewPlan(plan)
    this.stopUpdates()
  }

  public async handleSendPlanToVehicle() {
    try {
      const plan: IPlan | undefined = this.props.plans.find(p => p.id === this.props.selectedPlan.id)
      const vehicle = this.props.vehicleSelected
      if (!plan) {
        return
      }
      const body = await sendPlanToVehicle(plan, vehicle)
      NotificationManager.success(body.message)
      this.startUpdates()
    } catch (error) {
      NotificationManager.warning(error.message)
      this.handleCancelEditPlan()
    }
  }

  public handleCancelEditPlan() {
    this.props.cancelEditPlan()
    this.startUpdates()
  }

  public async handleSavePlan() {
    // send plan to server
    const plan: IPlan | undefined = this.props.plans.find(p => p.id === this.props.selectedPlan.id)
    if (plan) {
      try {
        const response = await sendUnassignedPlan(plan)
        this.startUpdates()
        this.props.savePlan()
        NotificationManager.success(response.message)
      } catch (error) {
        NotificationManager.warning(error.message)
      }
    }
  }

  public async handleUpdatePlanId(previousId: string, newId: string) {
    try {
      await updatePlanId(previousId, newId)
      NotificationManager.success(`Plan id has been updated`)
    } catch (error) {
      NotificationManager.warning(error.message)
    }
  }

  public async handleDeletePlan() {
    try {
      await deleteUnassignedPlan(this.props.selectedPlan.id)
      NotificationManager.success(`Plan ${this.props.selectedPlan.id} has been deleted`)
    } catch (error) {
      NotificationManager.warning(error.message)
    } finally {
      this.props.savePlan() // used to deselect the plan
      this.startUpdates()
    }
  }

  public onSliderChange(sliderValue: number) {
    if (sliderValue === 0) {
      // reset state
      this.startUpdates()
    } else {
      this.stopUpdates()
    }
    this.props.setSlider(sliderValue)
  }

  public render() {
    {
      if (!this.state.loading) {
        return (
          <div>
            <div className="navbar">
              <TopNav
                handleEditPlan={this.handleEditPlan}
                handleSendPlanToVehicle={this.handleSendPlanToVehicle}
                handleCancelEditPlan={this.handleCancelEditPlan}
                handleStartNewPlan={this.handleStartNewPlan}
                handleSavePlan={this.handleSavePlan}
                handleDeletePlan={this.handleDeletePlan}
                handleUpdatePlanId={this.handleUpdatePlanId}
              />
            </div>
            <RipplesMap />
            <SidePanel />
            <Slider onChange={this.onSliderChange} min={-12} max={12} value={this.props.sliderValue} />
          </div>
        )
      }
    }
    return <></>
  }
}

function mapStateToProps(state: IRipplesState) {
  return {
    auth: state.auth,
    plans: state.planSet,
    selectedPlan: state.selectedPlan,
    sliderValue: state.sliderValue,
    vehicleSelected: state.vehicleSelected,
  }
}

const actionCreators = {
  addNewPlan,
  cancelEditPlan,
  editPlan,
  savePlan,
  setAis,
  setPlans,
  setProfiles,
  setSlider,
  setSpots,
  setUser,
  setVehicles,
}

export default connect(
  mapStateToProps,
  actionCreators
)(Ripples)
