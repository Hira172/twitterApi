import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import {
    BrowserRouter as Router,
    Switch,
    Route
  } from "react-router-dom";
  
import ProfileCountTable from "./ProfileCountTable";
import SignleProfile from "./SingleProfile";
import SearchWithTag from "./SearchWithTag" 
import AllProfiles from './AllProfiles';
import SearchWithLabel from './SearchWithLabel';
import SearchWithScore from './SearchWithScore';
import MainAlgo from './MainAlgo';
import AddApiKey from './AddApiKey'
import UpdateProfile from './UpdateProfile';
import UpdateProfileTag from './UpdateProfileTag';
import DiscoverLevel0 from './DiscoverLevel0';

  export default function Menu() {

    return (
        <Router>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="/">Twitter</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">Home</Nav.Link>
              <Nav.Link href="/newLevel0">Add level0</Nav.Link>
              <Nav.Link href="/discoverLevel0">Discover level0</Nav.Link>
              <Nav.Link href="/addApiKey">Add Api Key</Nav.Link>
              <NavDropdown title="Update Profile" id="basic-nav-dropdown">
                <NavDropdown.Item href="/update/Profile/Label">add label </NavDropdown.Item>
                <NavDropdown.Item href="/update/Profile/Tag">add tag</NavDropdown.Item>
                <NavDropdown.Item href="/update/Profile/Tag/delete">delete tag</NavDropdown.Item>
              </NavDropdown>
              
              <Nav.Link  href="/profileCount" >Profile Count</Nav.Link>
              <NavDropdown title="Search" id="basic-nav-dropdown">
                <NavDropdown.Item href="/getData/profile">Profile </NavDropdown.Item>
                <NavDropdown.Item href="/getData/profile/Tag">By tag</NavDropdown.Item>
                <NavDropdown.Item href="/getData/profile/all">All Profiles</NavDropdown.Item>
                <NavDropdown.Item href="/getData/profile/label">By Label</NavDropdown.Item>
                <NavDropdown.Item href="/getData/profile/specificscore">Specific Score</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{margin:"3%"}}>
      <Switch>
          <Route path="/newLevel0">
            <MainAlgo ></MainAlgo>
          </Route>
          <Route path="/discoverLevel0">
            <DiscoverLevel0 ></DiscoverLevel0>
          </Route>
          <Route path="/addApiKey">
            <AddApiKey ></AddApiKey>
          </Route>
          <Route path="/update/Profile/label">
            <UpdateProfile ></UpdateProfile>
          </Route>
          <Route path="/update/Profile/tag">
            <UpdateProfileTag ></UpdateProfileTag>
          </Route>
          <Route path="/profileCount">
            <ProfileCountTable ></ProfileCountTable>
          </Route>
          <Route path="/getData/profile/Tag">
            <SearchWithTag></SearchWithTag>
          </Route>
          <Route path="/getData/profile/all">
            <AllProfiles></AllProfiles>
          </Route>
          <Route path="/getData/profile/label">
            <SearchWithLabel></SearchWithLabel>
          </Route>
          <Route path="/getData/profile/specificscore">
            <SearchWithScore></SearchWithScore>
          </Route>
          <Route path="/getData/profile">
            <SignleProfile></SignleProfile>
          </Route>
          
        </Switch>
        </div>
    </Router>
        
    );
  }
  

  