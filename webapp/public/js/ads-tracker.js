((global) => {
  'use strict';

  const {MutationObserver, fetch, document} = global;

  function eventAdLoaded(adElement) {
    const {dataset: {
      adName, adPlacement
    }} = adElement;

    return {
      type: 'load',
      adName,
      adPlacement
    };
  }

  function eventAdClicked(adElement) {
    const {dataset: {
      adName, adPlacement
    }} = adElement;

    return {
      type: 'click',
      adName,
      adPlacement
    };
  }

  function createAdsTracker({selector, apiUrl, events}) {
    function observeLoadEvent(adElement) {
      const observer = new MutationObserver((mutationList) => {
        mutationList
          .filter((mutation) => mutation.type === 'attributes' && mutation.attributeName === 'data-ad-loaded')
          .forEach(() => {
            if (adElement.dataset.adLoaded === 'true') {
              sendEvent(eventAdLoaded(adElement));
              observer.disconnect();
            }
          });
      });
      observer.observe(adElement, {attributes: true});
    }

    function observeClickEvent(adElement) {
      adElement.addEventListener('click', (event) => {
        event.preventDefault = true;
        setTimeout(() => {
          window.location.href = adElement.getAttribute('href');
        }, 100);
        sendEvent(eventAdClicked(adElement));
      }, false);
    }

    async function sendEvent(event) {
      const url = `${apiUrl}/events`;
      try {
        return await fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });
      } catch (error) {
        // send the error log to error tracking service
      }
    }

    function track() {
      document.querySelectorAll(selector).forEach((adElement) => {
        if (events.includes('load')) {
          observeLoadEvent(adElement);
        }
        if (events.includes('click')) {
          observeClickEvent(adElement);
        }
      });
    }

    return {
      track
    };
  }

  global.createAdsTracker = createAdsTracker;

})(window);
