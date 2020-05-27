import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

import { Form, InputGroup, FormControl } from 'react-bootstrap';
import Button from 'react-uwp/Button';
import ErrorHandler from './ErrorHandler';
import { logIn } from '../modules/action';
import { connect } from 'react-redux';

class Auth extends React.Component {
  state = {
    redirectToReferrer: false
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    logIn: PropTypes.func.isRequired,
    loggedIn: PropTypes.bool.isRequired
  };

  async componentDidMount() {
    this.usernameInput.focus();
    const { loggedIn, logIn } = this.props;
    if (loggedIn) {
      return this.setState({ redirectToReferrer: true });
    }

    const token = Cookies.get('fifa-profile');
    const decoded = await verifyToken(token);
    if (decoded) {
      logIn(decoded.username);
      return this.setState({ redirectToReferrer: true });
    }
  }

  handleUsernameChange = event => {
    const username = event.target.value;
    this.setState({ username });
  };

  handleLogin = async event => {
    // Send login request here. True only when 200 status from server
    event.preventDefault();
    const { username } = this.state;
    const { logIn } = this.props;

    const response = await axios.post('http://localhost:3003/auth/login', { username });
    if (!response.data.success) {
      return (
        <ErrorHandler
          redirectUrl="/"
          error={{ title: 'AUTH FAILED, TRY AGAIN!', content: response.message }}
        />
      );
    }
    Cookies.set('fifa-profile', response.data.token);
    logIn(username);
    this.setState({ redirectToReferrer: true });
  };

  enterUsername() {
    return (
      <div>
        <Form onSubmit={this.handleLogin}>
          <InputGroup>
            <FormControl
              ref={input => {
                this.usernameInput = input;
              }}
              placeholder="Enter your alias here"
              name="username"
              aria-label="username"
              aria-describedby="text"
              onChange={this.handleUsernameChange}
            />
            <InputGroup.Append>
              <Button>Submit</Button>
            </InputGroup.Append>
          </InputGroup>
        </Form>
      </div>
    );
  }

  render() {
    const { from } = this.props.location.state || { from: { pathname: '/' } };
    const { redirectToReferrer } = this.state;

    if (redirectToReferrer === true) {
      return <Redirect to={from} />;
    }

    return (
      <div className="row align-items-center justify-content-left">
        <div className="col-sm-12 col-md-6">
          {introInfo()}
          {this.enterUsername()}
        </div>
      </div>
    );
  }
}

const introInfo = () => {
  return (
    <div>
      <div>Hate the default lineup?</div>
      <div>
        Build custom teams <br /> with your friends. <br />
      </div>
      <div>
        Create or join a room to start <br /> custom draft with your friends <br />
      </div>
    </div>
  );
};

const verifyToken = async token => {
  const response = await axios.post('http://localhost:3003/auth/verify', { token });
  if (response.data.success) {
    return response.data.decoded;
  }
  return undefined;
};

const mapStateToProps = state => ({
  loggedIn: state.loggedIn
});

const mapDispatchToProps = dispatch => ({
  logIn: (username) => dispatch(logIn({ username })),
});

export default connect(mapStateToProps, mapDispatchToProps)(Auth);
