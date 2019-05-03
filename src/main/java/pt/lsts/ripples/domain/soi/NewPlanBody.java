package pt.lsts.ripples.domain.soi;

import pt.lsts.ripples.domain.assets.Plan;
import pt.lsts.ripples.domain.assets.Waypoint;

import java.util.ArrayList;
import java.util.List;

public class NewPlanBody {

	private String id;

	private List<Waypoint> waypoints = new ArrayList<>();

	private String assignedTo;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public List<Waypoint> getWaypoints() {
		return waypoints;
	}

	public void setWaypoints(List<Waypoint> waypoints) {
		this.waypoints = waypoints;
	}

	public String getAssignedTo() {
		return assignedTo;
	}

	public void setAssignedTo(String assignedTo) {
		this.assignedTo = assignedTo;
	}

	public Plan buildPlan() {
		Plan p = new Plan();
		p.setId(id);
		p.setWaypoints(waypoints);
		return p;
	}
}
