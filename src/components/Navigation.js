import Navbar from 'react-bootstrap/Navbar';

import logo from '../CGDev.png';

const Navigation = () => {
    return (
//        <Navbar className='my-3'>
          <Navbar className="my-3 bg-light" variant="light">
            <img
                alt="logo"
                src={logo}
                width="40"
                height="40"
                className="d-inline-block align-top mx-3"
            />
            <Navbar.Brand href="#">CGDev ICO Crowdsale</Navbar.Brand>
        </Navbar>
    );
}

export default Navigation;