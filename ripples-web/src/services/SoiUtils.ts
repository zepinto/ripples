import IAsset from "../model/IAsset";
import IPlan from "../model/IPlan";

const apiURL = process.env.REACT_APP_API_URL

export async function fetchSoiData() {
  const response = await fetch(`${apiURL}/soi`);
  const data = await response.json();
  let vehicles: IAsset[] = [];
  let spots: IAsset[] = [];
  data.forEach( (system: any) => {
    if (system.name.startsWith('spot')) {
      spots.push(system);
    }
    else {
      system.plan.waypoints = system.plan.waypoints.map((wp: any) => 
        Object.assign({}, 
          {
            timestamp: wp.arrivalDate,
            latitude: wp.latitude,
            longitude: wp.longitude
          }))
      system.lastState.timestamp = system.lastState.timestamp * 1000
      vehicles.push(system)
    }
  });
  console.log("soi vehicles", vehicles)
  return { vehicles: vehicles, spots: spots };
}

export async function fetchProfileData() {
  const response = await fetch(`${apiURL}/soi/profiles`);
  const data = await response.json();
  console.log('profile data:', data);
  return data;
}

async function postNewPlan(vehicleName: string, newPlan: IPlan) {
  console.log("Called post new plan")
  const response = await fetch(`${apiURL}/soi`, {
    method: "POST",
    headers: new Headers({ 'content-type': 'application/json' }),
    body: JSON.stringify({ vehicleName: vehicleName, plan: newPlan }),
  });
  return await Promise.all([response.ok, response.json()]);
}

export async function fetchAwareness() {
  const response = await fetch(`${apiURL}/soi/awareness`)
  const data = await response.json()
  console.log("awareness data:", data)
  return data
}

export async function sendPlanToVehicle(selectedPlan: string, vehicles: IAsset[]) {
    const vehicleIdx = vehicles.findIndex(v => v.plan.id === selectedPlan);
    if (vehicleIdx >= 0) {
      let plan = JSON.parse(JSON.stringify(vehicles[vehicleIdx].plan));
      plan.waypoints = plan.waypoints.map((wp: any) => {
      let timestamp = wp.timestamp
      delete wp.timestamp
      return Object.assign(wp, { eta: timestamp / 1000, duration: 60})
    })
      return postNewPlan(vehicles[vehicleIdx].name, plan)
    }
}