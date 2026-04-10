import { createTripHeader } from "./components/TripHeader.js";
import { createEntryGate } from "./components/EntryGate.js";
import { createCategoryFilterBar } from "./components/CategoryFilterBar.js";
import { createAddPlaceForm } from "./components/AddPlaceForm.js";
import { createSuggestionLauncher } from "./components/SuggestionLauncher.js";
import { createPlaceList } from "./components/PlaceList.js";
import { createMapPanel, enhanceMapPanel } from "./components/MapPanel.js";
import { createStore } from "./state/store.js";
import { sampleTrip } from "./data/sampleTrip.js";

const runtimeConfig = window.__DJ_CONFIG__ || {};

export function mountApp(root) {
  const store = createStore(sampleTrip, runtimeConfig);

  const render = () => {
    const state = store.getState();
    const shell = document.createElement("div");
    shell.className = "page-shell";

    shell.innerHTML = `
      <div class="page-bg page-bg-top"></div>
      <div class="page-bg page-bg-bottom"></div>
      <div class="page-layout">
        <aside class="left-panel">
          <div class="left-panel-inner">
            <div data-slot="header"></div>
            <section class="board-section board-section-tight">
              <div data-slot="filter"></div>
            </section>
            <section class="board-section board-section-tight">
              <div data-slot="suggestion-launcher"></div>
            </section>
            <section class="board-section board-section-fill">
              <div data-slot="places"></div>
            </section>
          </div>
        </aside>
        <section class="right-panel">
          <div class="right-panel-inner" data-slot="map"></div>
        </section>
      </div>
    `;

    shell.querySelector('[data-slot="header"]').append(
      createTripHeader(state, {
        copyUrl: store.copyShareUrl
      })
    );

    shell.querySelector('[data-slot="filter"]').append(
      createCategoryFilterBar(state, {
        setCategory: store.setCategory
      })
    );

    shell.querySelector('[data-slot="suggestion-launcher"]').append(
      createSuggestionLauncher({
        openAddForm: store.openAddForm
      })
    );

    shell.querySelector('[data-slot="places"]').append(
      createPlaceList(state, {
        selectPlace: store.selectPlace,
        addComment: store.addComment
      })
    );

    const mapPanel = createMapPanel(state);
    shell.querySelector('[data-slot="map"]').append(mapPanel);

    root.replaceChildren(shell);
    enhanceMapPanel(mapPanel, state, {
      selectPlace: store.selectPlace
    });

    if (state.isAddFormOpen) {
      root.append(
        createAddPlaceForm(state, {
          closeAddForm: store.closeAddForm,
          addPlace: store.addPlace
        })
      );
    }

    const gate = createEntryGate(state, {
      unlockAccess: store.unlockAccess
    });

    if (gate) {
      root.append(gate);
    }
  };

  render();
  store.subscribe(render);
  store.initialize();
}
