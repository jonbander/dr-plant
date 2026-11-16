# Grape downy mildew weather early-warning indicator

## What it does

The optional online panel requests hourly forecast and recent weather for a location the grower explicitly selects with browser geolocation. Coordinates are stored only in that browser's local storage and are sent directly to Open-Meteo when weather is requested. Dr Plant does not receive or store the coordinates on a server.

The panel evaluates two conservative weather signals:

1. **10:10:24 weather component:** at least 10 mm precipitation over a 24-hour window with mean air temperature at least 10°C. The agronomic rule also depends on vine shoots reaching about 10 cm, wet soil, and leaf wetness; those are not measured by this app. A weather trigger is therefore not a confirmed primary infection.
2. **Humid-night support:** at least three consecutive night hours with relative humidity at least 80% and temperature from 10°C to 30°C. This indicates potentially favourable sporulation conditions only. It does not measure leaf wetness, inoculum, or spore dispersal and cannot confirm secondary infection.

The thresholds are informed by published grape downy mildew epidemiology and warning-system literature, including the 10:10:24/3-10 rule and models incorporating night humidity, temperature, rainfall, and leaf wetness. The implementation is a deliberately simplified screening indicator, not a reproduction of a validated mechanistic model.

## Limitations

- Open-Meteo grid weather is not an in-vineyard leaf-wetness sensor. Local terrain, canopy, irrigation, and microclimate can differ.
- The user must select the vineyard location and verify the crop is grape.
- The indicator does not know cultivar, phenology, disease history, inoculum, or actual symptoms.
- It does not diagnose disease, predict infection probability, or recommend pesticide application.
- It refreshes when the panel is opened or the user presses refresh. It does not send background push notifications while the app is closed.
- It requires internet. The rest of the offline screening workflow remains available offline.

## API and cost

The prototype uses the public Open-Meteo Forecast API without an API key. Its free endpoint is limited to non-commercial use (up to 10,000 calls/day, with additional hourly/minute limits) and has no uptime guarantee; the API data is CC BY 4.0 and requires attribution. Do not use this free endpoint in an app that displays ads, charges subscriptions, or promotes commercial services. Before deploying this feature in an app that displays advertising, charges users, or is otherwise commercial, obtain an appropriate Open-Meteo commercial licence or replace the provider. See https://open-meteo.com/en/terms and https://open-meteo.com/en/pricing.

## References

- NC State Extension, 10:10:24 rule and leaf-wetness requirements: https://content.ces.ncsu.edu/north-carolina-winegrape-growers-guide/chapter-8-pest-management
- Cornell, grape downy mildew conditions and management: https://cals.cornell.edu/integrated-pest-management/grapevine-downy-mildew-plasmopara-viticola-fruit-fact-sheet
- UC IPM, grape downy mildew epidemiology: https://ipm.ucanr.edu/agriculture/grape/downy-mildew/
- Weather-driven infection model (2021): https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2021.636607/full
- Open-Meteo API terms: https://open-meteo.com/en/terms
