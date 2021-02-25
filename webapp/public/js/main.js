((global) => {
  'use strict';

  const {document, createAdsService, createAdsTracker} = global;

  // sanity check
  if (!createAdsService || !createAdsTracker) {
    document.querySelector('h1').innerText = '-- UNABLE TO LOAD AD MODULES, BE SURE TO DISABLE YOUR ADBLOCK --';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const selector = '[data-ad]';

    const adsService = createAdsService({
      selector,
      apiUrl: 'https://mocked-ads-service.com'
    });

    const adsTracker = createAdsTracker({
      selector,
      apiUrl: 'http://localhost:4000',
      events: ['load', 'click']
    });

    adsTracker.track();
    adsService.load();
  });

})(window);
