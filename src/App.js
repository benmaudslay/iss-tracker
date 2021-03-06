import React, { Component } from "react"
import ReactMapGL, { Marker } from "react-map-gl"
// Stylesheets
import "./App.css"
import "./media.css"
// Assets
import ISS1 from "./img/iss-1.png"
import NasaAltLogo from "./img/nasa-alt-logo.png"
import NasaLoadLogo from "./img/nasa-load-logo2.gif"

// Because this is being used as a teaching resource, all components are kept in this file.
// Normally each component would be in its own file and tokens would be hidden.

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYmVubWF1ZHNsYXkiLCJhIjoiY2p0N2RtOHB1MDJzbDN5bzh5c25zaDllZyJ9.D0RtSq3i_afvqrXX2jHFbg"

class App extends Component {
  state = {
    viewport: {
      width: "100%",
      height: "100%",
      latitude: 37.7577,
      longitude: -122.4376,
      zoom: this.getZoom
    },
    iss: {
      lat: 0,
      long: 0,
      timestamp: 0,
      velocity: 0,
      altitude: 0
    },
    windowHeight: undefined,
    windowWidth: undefined,
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-v9",
      dark: "mapbox://styles/mapbox/dark-v9",
      light: "mapbox://styles/mapbox/light-v9",
      outdoors: "mapbox://styles/mapbox/outdoors-v10",
      streets: "mapbox://styles/mapbox/streets-v10"
    },
    chosenStyle: "mapbox://styles/mapbox/streets-v10",
    loaded: false,
    currentZoom: 2
  }

  getZoom = () => {
    const { currentZoom } = this.state
    return currentZoom
  }

  handleMapStyle = style => {
    const { styles } = this.state
    let newStyle
    switch (style.toLowerCase()) {
      case "satellite":
        newStyle = styles.satellite
        break
      case "dark":
        newStyle = styles.dark
        break
      case "light":
        newStyle = styles.light
        break
      case "outdoors":
        newStyle = styles.outdoors
        break
      case "streets":
        newStyle = styles.streets
        break
      default:
        newStyle = styles.streets
        break
    }
    this.setState({ chosenStyle: newStyle })
  }

  // This method persists the user controlled zoom level
  handleZoom = () => {
    const { currentZoom, viewport } = this.state
    const newZoom = viewport.zoom
    currentZoom !== newZoom && this.setState({ currentZoom: newZoom })
  }

  // This method ensures that the map maintains its styling when the size of the window changes.
  handleResize = () => {
    this.setState({
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth
    })
  }

  // Allows control of load time
  handleLoad = () => this.setState({ loaded: true })

  // Required by ReactMapboxGL
  handleView = viewport => this.setState({ viewport })

  componentDidMount() {
    this.interval = setInterval(() => {
      const { currentZoom } = this.state

      // API call
      fetch("https://api.wheretheiss.at/v1/satellites/25544")
        .then(res => res.json())
        .then(data => {
          this.setState({
            iss: {
              lat: data.latitude,
              long: data.longitude,
              timestamp: data.timestamp,
              velocity: data.velocity,
              altitude: data.altitude
            },
            viewport: {
              height: "100%",
              width: "100%",
              latitude: data.latitude,
              longitude: data.longitude,
              zoom: currentZoom
            }
          })
        })
        .catch(err => console.log(err))
    }, 3000)

    this.handleResize()
    window.addEventListener("resize", this.handleResize)
  }

  componentDidUpdate() {
    this.handleZoom()
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize)
    clearInterval(this.interval)
  }

  render() {
    const { viewport, iss, chosenStyle, loaded } = this.state
    return (
      <div>
        {loaded && iss.lat && iss.long !== 0 ? (
          <Main
            iss={iss}
            viewport={viewport}
            chosenStyle={chosenStyle}
            handleView={this.handleView}
            handleMapStyle={this.handleMapStyle}
          />
        ) : (
          <Loading handleLoad={this.handleLoad} />
        )}
      </div>
    )
  }
}

const Loading = ({ handleLoad }) => {
  // Set minimum load time to 2s
  setTimeout(() => handleLoad(), 2000)

  return (
    <div className="App">
      <div className="App-header">
        <img className="App-logo" src={NasaLoadLogo} alt="Nasa" />
        Loading...
      </div>
    </div>
  )
}

const Main = ({ iss, viewport, chosenStyle, handleView, handleMapStyle }) => {
  return (
    <div className="container">
      <div className="sidebar">
        <Dashboard handleMapStyle={handleMapStyle} iss={iss} />
      </div>
      <div className="main">
        <MapInterface
          iss={iss}
          viewport={viewport}
          chosenStyle={chosenStyle}
          handleView={handleView}
        />
      </div>
    </div>
  )
}

const Logo = () => (
  <a href="https://www.nasa.gov/" target="_blank" className="wrapperLink">
    <div className="logoWrapper" href="https://www.nasa.gov/">
      <img src={NasaAltLogo} alt="NASA" className="altLogo" />
      <div className="logoText">
        <span>
          <span>INTERNATIONAL </span>SPACE STATION
        </span>
      </div>
    </div>
  </a>
)

const MapInterface = ({ viewport, chosenStyle, iss, handleView }) => {
  return (
    <ReactMapGL
      {...viewport}
      onViewportChange={viewport => handleView(viewport)}
      mapboxApiAccessToken={MAPBOX_TOKEN}
      mapStyle={chosenStyle}
    >
      <Marker
        latitude={iss.lat}
        longitude={iss.long}
        offsetLeft={0}
        offsetTop={0}
      >
        <div className="spaceStationContainer">
          <div className="littleRedDot" />
          {/* Fall back to show the ISS position should the img not load */}
          <img className="spaceStation" alt="Space Station" src={ISS1} />
        </div>
      </Marker>
    </ReactMapGL>
  )
}

const Dashboard = ({ handleMapStyle, iss }) => {
  // Rounding the long, lat to 6 decimal places
  let searchTerm = ".",
    long = iss.long.toString(),
    lat = iss.lat.toString(),
    decimalPosLat = lat.indexOf(searchTerm) + 7,
    decimalPosLong = long.indexOf(searchTerm) + 7,
    shortLong = long.slice(0, decimalPosLong),
    shortLat = lat.slice(0, decimalPosLat)

  return (
    <div className="dashboard">
      <Logo />
      <div className="dashContent">
        <div className="measures">
          <Measurement desc="Latitude" stat={shortLat} />
          <Measurement desc="Longitude" stat={shortLong} />
          <Measurement
            desc="Velocity"
            stat={Math.round(iss.velocity)}
            unit="km/s"
          />
          <Measurement
            desc="Altitude"
            stat={Math.round(iss.altitude)}
            unit="km"
          />
        </div>
        <div className="buttonContainer">
          <div className="styleButtons">
            <p className="buttonHeader">Map style:</p>
            <MapStyleButton
              handleMapStyle={handleMapStyle}
              buttonVal="Satellite"
            />
            <MapStyleButton handleMapStyle={handleMapStyle} buttonVal="Dark" />
            <MapStyleButton handleMapStyle={handleMapStyle} buttonVal="Light" />
            <MapStyleButton
              handleMapStyle={handleMapStyle}
              buttonVal="Outdoors"
            />
            <MapStyleButton
              handleMapStyle={handleMapStyle}
              buttonVal="Streets"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const MapStyleButton = ({ handleMapStyle, buttonVal }) => (
  <button onClick={() => handleMapStyle(buttonVal)}>{buttonVal}</button>
)

const Measurement = ({ desc, stat, unit }) => (
  <div className="measurementWrapper">
    <li className="measurementItem">
      <span>{desc}: </span>
      <span className="measurementStat">
        {stat} {unit && unit}
      </span>
    </li>
    <div className="listLine" />
  </div>
)

export default App
