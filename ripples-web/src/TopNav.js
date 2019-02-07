import React, { Component } from 'react'
import { Navbar, NavbarBrand, Collapse, NavbarToggler, Nav, NavItem, NavLink, Dropdown, DropdownItem, DropdownToggle, DropdownMenu } from 'reactstrap';


export default class TopNav extends Component {

  constructor(props) {
    super(props)

    this.state = {
      isNavOpen: true,
      dropdownOpen: false,
      execPlanDisabled: true,
    }

    this.onNavToggle = this.onNavToggle.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this)
    this.handleExecPlan = this.handleExecPlan.bind(this)
    this.toogleDrawNewPlan = this.handleDrawNewPlan.bind(this)
  }

  onNavToggle() {
    this.setState({ isNavOpen: !this.state.isNavOpen });
  }

  toggleDropdown() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  handleExecPlan() {
    this.setState({
      execPlanDisabled: !this.state.execPlanDisabled
    })
    this.props.handleExecPlan()
  }
  handleDrawNewPlan() {
    this.setState({
      execPlanDisabled: !this.state.execPlanDisabled
    })
    this.props.handleDrawNewPlan();
  }


  getPlans() {
    return this.props.plans.map(p => {
      return <DropdownItem key={"dropdown-item-" + p} onClick={() => this.props.handleEditPlan(p)}>{p}</DropdownItem>
    })
  }

  render() {
    return (
      <Navbar color="faded" light expand="md">
        <NavbarBrand className="mr-auto">Ripples</NavbarBrand>
        <NavbarToggler className="mr-2" onClick={this.onNavToggle} />
        <Collapse isOpen={this.state.isNavOpen} navbar>
          <Nav className="ml-auto" navbar>
            <NavItem>
              <NavLink disabled={!this.state.execPlanDisabled} onClick={this.toogleDrawNewPlan} href="#" >Draw new plan</NavLink>
            </NavItem>
            <NavItem>
              <NavLink disabled={this.state.execPlanDisabled} onClick={this.handleExecPlan} href="#">Execute plan</NavLink>
            </NavItem>
            <Dropdown nav isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
              <DropdownToggle nav caret>
                {this.props.dropdownText}
              </DropdownToggle>
              <DropdownMenu>
                {this.getPlans()}
              </DropdownMenu>
            </Dropdown>
          </Nav>
        </Collapse>
      </Navbar>)
  }
  /*
    render() {
      return (
        <div>
          <h3>Menu</h3>
          <hr></hr>
          <Nav vertical>
            <NavItem>
              <NavLink disabled={!this.state.execPlanDisabled} onClick={this.toogleDrawNewPlan} href="#" >Draw new plan</NavLink>
            </NavItem>
            <NavItem>
              <NavLink disabled={this.state.execPlanDisabled} onClick={this.handleExecPlan} href="#">Execute plan</NavLink>
            </NavItem>
            <Dropdown nav isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
              <DropdownToggle nav caret>
                {this.props.dropdownText}
              </DropdownToggle>
              <DropdownMenu>
                {this.getPlans()}
              </DropdownMenu>
            </Dropdown>
          </Nav>
        </div>
      );
    }*/
}

