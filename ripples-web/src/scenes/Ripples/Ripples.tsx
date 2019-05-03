import React, { Component, ChangeEvent } from 'react'
import 'react-notifications/lib/notifications.css';
const { NotificationManager } = require('react-notifications');
import { fetchSoiData, fetchProfileData, fetchAwareness, sendPlanToVehicle, mergeAssetSettings, sendUnassignedPlan } from '../../services/SoiUtils'
import './styles/Ripples.css'
import TopNav from './components/TopNav';
import Slider from './components/Slider';
import { fetchAisData } from '../../services/AISUtils';
import { estimatePositionsAtDeltaTime } from '../../services/PositionUtils';
import IAisShip from '../../model/IAisShip';
import { connect } from 'react-redux';
import { setVehicles, setSpots, setAis, editPlan, setSlider, cancelEditPlan, setUser, setProfiles, addNewPlan, savePlan, setPlans } from '../../redux/ripples.actions';
import IRipplesState from '../../model/IRipplesState';
import RipplesMap from './components/RipplesMap';
import UserState, { IUser } from '../../model/IAuthState';
import { getCurrentUser } from '../../services/AuthUtils';
import IProfile from '../../model/IProfile';
import IPlan from '../../model/IPlan';


type stateType = {
  loading: boolean
};

type propsType = {
  plans: IPlan[]
  setVehicles: Function
  setSpots: Function
  setAis: Function
  setPlans: (_: IPlan[]) => void
  setSlider: Function
  editPlan: (_:IPlan) => void
  addNewPlan: (_: IPlan) => void
  setProfiles: (profiles: IProfile[]) => any
  setUser: (user: IUser) => any
  savePlan: () => void
  cancelEditPlan: Function
  selectedPlan: IPlan
  sliderValue: number
  auth: UserState
}


class Ripples extends Component<propsType, stateType> {

  soiTimer: number = 0
  aisTimer: number = 0

  constructor(props: any) {
    super(props);
    this.state = {
      loading: true
    }
    this.handleCancelEditPlan = this.handleCancelEditPlan.bind(this)
    this.handleEditPlan = this.handleEditPlan.bind(this)
    this.handleStartNewPlan = this.handleStartNewPlan.bind(this)
    this.handleSavePlan = this.handleSavePlan.bind(this)
    this.onSliderChange = this.onSliderChange.bind(this)
    this.handleSendPlanToVehicle = this.handleSendPlanToVehicle.bind(this)
    this.stopUpdates = this.stopUpdates.bind(this)
    this.startUpdates = this.startUpdates.bind(this)
    this.updateSoiData = this.updateSoiData.bind(this)
    this.updateAISData = this.updateAISData.bind(this)
    this.loadCurrentlyLoggedInUser = this.loadCurrentlyLoggedInUser.bind(this)
  }

  async loadCurrentlyLoggedInUser() {
    try {
      const user: IUser = await getCurrentUser()
      this.props.setUser(user)
      NotificationManager.info(`${user.role.toLowerCase()}: ${user.email}`)
    } catch (error) {
      localStorage.removeItem("ACCESS_TOKEN");
    }
  }

  async componentDidMount() {
    await this.loadCurrentlyLoggedInUser()
    this.setState({loading: false})
    this.startUpdates();
  }

  stopUpdates() {
    console.log("Stop updates called")
    clearInterval(this.soiTimer);
    clearInterval(this.aisTimer);
  }

  startUpdates(e?: any) {
    console.log("Start updates called", e)
    this.updateSoiData();
    this.updateAISData();
    if (!this.soiTimer) {
      this.soiTimer = window.setInterval(this.updateSoiData, 60000);
    }
    if (!this.aisTimer) {
      this.aisTimer = window.setInterval(this.updateAISData, 60000); //get ais data every minute
    }
  }

  componentWillUnmount() {
    clearInterval(this.soiTimer);
    clearInterval(this.aisTimer)
  }

  async updateSoiData() {
    try {
      const soiData = await fetchSoiData()
      let vehicles = soiData.vehicles;
      mergeAssetSettings(vehicles, this.props.auth)

      // fetch profiles
      let profiles = await fetchProfileData();
      profiles = profiles.filter(p => p.samples.length > 0)
      this.props.setProfiles(profiles)

      // fetch soi awareness
      const assetsAwareness = await fetchAwareness()
      assetsAwareness.forEach(assetAwareness => {
        let vehicle = vehicles.find(v => v.name === assetAwareness.name)
        if (vehicle) {
          vehicle.awareness = assetAwareness.positions
        }
      })
      // update redux store
      this.props.setVehicles(soiData.vehicles);
      this.props.setSpots(soiData.spots)
      this.props.setPlans(soiData.plans)
    } catch (error) {
      NotificationManager.warning('Failed to fetch data')
      console.error(error)
    }
  }

  async updateAISData() {
    const deltaHours = 12
    let shipsData: IAisShip[] = await fetchAisData()
    shipsData.forEach(ship => {
      ship.awareness = estimatePositionsAtDeltaTime(ship, deltaHours)
    })
    // update redux store
    this.props.setAis(shipsData)

  }

  handleEditPlan = (p: IPlan) => {
    this.props.editPlan(p)
    this.stopUpdates();
  }

  handleStartNewPlan = (planId: string) => {
    let plan: IPlan = {
      id: planId,
      assignedTo: '',
      waypoints: []
    }
    this.props.addNewPlan(plan)
    this.stopUpdates();
  }

  async handleSendPlanToVehicle() {
    try{
      const body = await sendPlanToVehicle(this.props.selectedPlan)
      NotificationManager.success(
        body.message,
      );
      this.startUpdates();
    } catch (error) {
      NotificationManager.warning(
        error.message,
      );
      this.handleCancelEditPlan();
    }
  }

  handleCancelEditPlan() {
    this.startUpdates();
    this.props.cancelEditPlan()
  }

  async handleSavePlan() {
    // send plan to server
    const plan: IPlan | undefined = this.props.plans.find(p => p.id == this.props.selectedPlan.id)
    if (plan != undefined) {
      console.log("Trying to save plan: ", plan);
      try {
        const response = await sendUnassignedPlan(plan);
        this.startUpdates()
        this.props.savePlan()
        NotificationManager.success(
          response.message,
        );
      } catch(error) {
        NotificationManager.warning(
          error.message,
        );
      }
    } 
  }

  onSliderChange(sliderValue: number) {
    if (sliderValue === 0) {
      // reset state
      this.startUpdates()
    } else {
      this.stopUpdates()
    }
    this.props.setSlider(sliderValue)
  }

  freedrawRef = React.createRef();

  render() {
    {if (!this.state.loading) {
      return (
        <div>
          <div className="navbar">
            <TopNav
              handleEditPlan={this.handleEditPlan}
              handleSendPlanToVehicle={this.handleSendPlanToVehicle}
              handleCancelEditPlan={this.handleCancelEditPlan}
              handleStartNewPlan={this.handleStartNewPlan}
              handleSavePlan={this.handleSavePlan}
            >
            </TopNav>
          </div>
          <RipplesMap></RipplesMap>
          <Slider onChange={this.onSliderChange} min={-12} max={12} value={this.props.sliderValue}></Slider>
        </div>
      )
    }}
    return <></>
  }
}

function mapStateToProps(state: IRipplesState) {
  return {
    selectedPlan: state.selectedPlan,
    sliderValue: state.sliderValue,
    auth: state.auth,
    plans: state.planSet,
  }
}


const actionCreators = {
  setProfiles,
  setVehicles,
  setSpots,
  setPlans,
  setAis,
  editPlan,
  cancelEditPlan,
  setSlider,
  setUser,
  addNewPlan,
  savePlan,
}

export default connect(mapStateToProps, actionCreators)(Ripples)