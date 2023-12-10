async function getWeatherData() {
    try {
      const serverData = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.4&lon=24.7`
      );
      const data = await serverData.json();
      for(let i = 0; i <= 4; i++){
        let time = data.properties.timeseries[i].time;
        let temperature = Math.round(data.properties.timeseries[i].data.instant.details.air_temperature);
        console.log(`${time} ${temperature}C`);
      }    
    } catch (error) {
      console.log(error);
    }
  }

 getWeatherData();