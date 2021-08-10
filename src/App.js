import "./App.css";
import "tachyons";
import Particles from "react-tsparticles";

import Navigation from "./components/Navigation/Navigation";
import Logo from "./components/Logo/Logo";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import Rank from "./components/Rank/Rank";
import React from "react";
import Clarifai, { FACE_DETECT_MODEL } from "clarifai";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import SignIn from "./components/Signin/Signin";
import Register from "./components/Register/Register";

const app = new Clarifai.App({
	apiKey: "44abab5eb3524a559edcf91c00744c3a",
});

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
	route: "signin",
	isSignedIn: false,
	user: {
		id: "",
		name: "",
		email: "",
		entries: 0,
		joined: "",
	},
};

class App extends React.Component {
	constructor() {
		super();
		this.state = initialState;
	}

	loadUser = (data) => {
		this.setState({
			user: {
				id: data.id,
				name: data.name,
				email: data.email,
				entries: data.entries,
				joined: data.joined,
			},
		});
	};

	calculateFaceLocation = (data) => {
		const clarifaiFace =
			data?.outputs?.[0]?.data?.regions?.[0]?.region_info?.bounding_box;
		const image = document.getElementById("inputImage");
		const width = Number(image.width);
		const height = Number(image.height);

		return {
			leftCol: clarifaiFace.left_col * width,
			topRow: clarifaiFace.top_row * height,
			rightCol: width - clarifaiFace.right_col * width,
			bottomRow: height - clarifaiFace.bottom_row * height,
		};
	};

	displayFaceBox = (box) => {
		this.setState({ box });
	};

	onInputChange = (event) => {
		this.setState({
			input: event.target.value,
		});
	};

	onSubmit = () => {
		this.setState({ imageURL: this.state.input });
		app.models
			.predict(FACE_DETECT_MODEL, this.state.input)
			.then((res) => {
				if (res) {
					fetch("http://localhost:3000/image", {
						method: "put",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							id: this.state.user.id,
						}),
					})
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
			this.setState(initialState);
		} else if (route === "home") {
			this.setState({ isSignedIn: true });
		}
		this.setState({ route });
	};

	render() {
		const { isSignedIn, box, route, imageURL } = this.state;
		return (
			<div className="App">
				<Particles className="particles" options={particleOptions} />
				<Navigation
					isSignedIn={isSignedIn}
					onRouteChange={this.onRouteChange}
				/>
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
