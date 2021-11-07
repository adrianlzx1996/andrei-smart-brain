import "./App.css";
import "tachyons";
import Particles from "react-tsparticles";

import Navigation from "./components/Navigation/Navigation";
import Logo from "./components/Logo/Logo";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import Rank from "./components/Rank/Rank";
import React from "react";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import SignIn from "./components/Signin/Signin";
import Register from "./components/Register/Register";
import Modal from "./components/Modal/Modal";
import Profile from "./components/Profile/Profile";

const particleOptions = {
	particles: {
		links: {
			color: "#ffffff",
			distance: 150,
			enable: true,
			opacity: 0.5,
			width: 1,
		},
		collisions: {
			enable: true,
		},
		move: {
			direction: "none",
			enable: true,
			outMode: "bounce",
			random: true,
			speed: 5,
			straight: false,
		},
		number: {
			density: {
				enable: true,
				value_area: 800,
			},
			value: 100,
		},
	},
};

const initialState = {
	input: "",
	imageURL: "",
	box: {},
	route: "home",
	isSignedIn: true,
	isProfileOpen: false,
	user: {
		id: "",
		name: "",
		email: "",
		entries: 0,
		joined: "",
		pet: "",
	},
};

class App extends React.Component {
	constructor() {
		super();
		this.state = initialState;
	}

	componentDidMount() {
		const token = window.sessionStorage.getItem("token");

		if (token) {
			fetch("https://sheltered-fortress-88899.herokuapp.com/signin", {
				method: "post",
				headers: {
					"Content-Type": "application/json",
					Authorization: token,
				},
			})
				.then((resp) => resp.json())
				.then((data) => {
					if (data && data.id) {
						fetch(
							`https://sheltered-fortress-88899.herokuapp.com/profile/${data.id}`,
							{
								method: "post",
								headers: {
									"Content-Type": "application/json",
									Authorization: token,
								},
							}
						)
							.then((resp) => resp.json())
							.then((user) => {
								if (user && user.email) {
									this.loadUser(user);
									this.onRouteChange("home");
								}
							});
					}
				})
				.catch(console.log);
		}
	}

	loadUser = (data) => {
		this.setState({
			user: {
				id: data.id,
				name: data.name,
				email: data.email,
				entries: data.entries,
				joined: data.joined,
				pet: data.pet,
			},
		});
	};

	calculateFaceLocation = (data) => {
		if (data && data.outputs) {
			const clarifaiFace =
				data?.outputs?.[0]?.data?.regions?.[0]?.region_info
					?.bounding_box;
			const image = document.getElementById("inputImage");
			const width = Number(image.width);
			const height = Number(image.height);

			return {
				leftCol: clarifaiFace.left_col * width,
				topRow: clarifaiFace.top_row * height,
				rightCol: width - clarifaiFace.right_col * width,
				bottomRow: height - clarifaiFace.bottom_row * height,
			};
		}

		return;
	};

	displayFaceBox = (box) => {
		if (box) {
			this.setState({ box });
		}
	};

	onInputChange = (event) => {
		this.setState({
			input: event.target.value,
		});
	};

	onSubmit = () => {
		this.setState({ imageURL: this.state.input });
		fetch("https://sheltered-fortress-88899.herokuapp.com/imageurl", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
				Authorization: window.sessionStorage.getItem("token"),
			},
			body: JSON.stringify({
				input: this.state.input,
			}),
		})
			.then((response) => response.json())
			.then((res) => {
				if (res) {
					fetch(
						"https://sheltered-fortress-88899.herokuapp.com/image",
						{
							method: "put",
							headers: {
								"Content-Type": "application/json",
								Authorization:
									window.sessionStorage.getItem("token"),
							},
							body: JSON.stringify({
								id: this.state.user.id,
							}),
						}
					)
						.then((response) => response.json())
						.then((count) => {
							this.setState(
								Object.assign(this.state.user, {
									entries: count,
								})
							);
						});
				}
				this.displayFaceBox(this.calculateFaceLocation(res));
			})
			.catch((err) => console.log(err));
	};

	onRouteChange = (route) => {
		if (route === "signout") {
			return this.setState(initialState);
		} else if (route === "home") {
			this.setState({ isSignedIn: true });
		}
		this.setState({ route });
	};

	toggleModal = () => {
		this.setState((prevState) => ({
			...prevState,
			isProfileOpen: !prevState.isProfileOpen,
		}));
	};

	render() {
		const { isSignedIn, box, route, imageURL, isProfileOpen, user } =
			this.state;
		return (
			<div className="App">
				<Particles className="particles" options={particleOptions} />
				<Navigation
					isSignedIn={isSignedIn}
					onRouteChange={this.onRouteChange}
					toggleModal={this.toggleModal}
				/>
				{isProfileOpen && (
					<Modal>
						<Profile
							user={user}
							isProfileOpen={isProfileOpen}
							toggleModal={this.toggleModal}
							loadUser={this.loadUser}
						/>
					</Modal>
				)}
				{route === "home" ? (
					<>
						<Logo />
						<Rank
							name={this.state.user.name}
							entries={this.state.user.entries}
						/>
						<ImageLinkForm
							onInputChange={this.onInputChange}
							onButtonSubmit={this.onSubmit}
						/>
						<FaceRecognition img={imageURL} faceBox={box} />
					</>
				) : route === "signin" ? (
					<SignIn
						loadUser={this.loadUser}
						onRouteChange={this.onRouteChange}
					/>
				) : (
					<Register
						loadUser={this.loadUser}
						onRouteChange={this.onRouteChange}
					/>
				)}
			</div>
		);
	}
}

export default App;
