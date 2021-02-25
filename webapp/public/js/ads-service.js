((global) => {
  'use strict';

  const {document} = global;

  const mockAds = {
    'nick-bostrom-superintelligence': {
      url: 'https://www.amazon.com/Superintelligence-Dangers-Strategies-Nick-Bostrom/dp/0199678111/',
      label: 'Advertisement: read "Superintelligence" by Nick Bostrom'
    },
    'ray-kurzweil-singularity': {
      url: 'https://www.amazon.com/Singularity-Near-Humans-Transcend-Biology/dp/0143037889',
      label: 'Advertisement: read "The Singularity is Near" by Ray Kurzweil'
    },
    'alex-davies-driven': {
      url: 'https://www.amazon.com/Driven-Race-Create-Autonomous-Car/dp/1501199439',
      label: 'Advertisement: read "Driven" by Alex Davies'
    }
  }

  function createAdsService({selector}) {
    function load() {
      document.querySelectorAll(selector).forEach((adElement) => {
        setTimeout(() => {
          const {dataset} = adElement;
          const adData = mockAds[dataset.adName];
          adElement.setAttribute('href', adData.url);
          adElement.innerText = adData.label;
          dataset.adLoaded = true;
        }, Math.random() * 2000);
      });
    }

    return {
      load
    };
  }

  global.createAdsService = createAdsService;
})(window);
