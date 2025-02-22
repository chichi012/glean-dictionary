<script>
  import page from "page";
  import { parse as queryStringParse } from "query-string";
  import { afterUpdate } from "svelte";

  // Pages
  import AppList from "./pages/AppList.svelte";
  import AppDetail from "./pages/AppDetail.svelte";
  import AppIdDetail from "./pages/AppIdDetail.svelte";
  import PingDetail from "./pages/PingDetail.svelte";
  import MetricDetail from "./pages/MetricDetail.svelte";
  import TableDetail from "./pages/TableDetail.svelte";

  // Components
  import Breadcrumb from "./components/Breadcrumb.svelte";
  import Footer from "./components/Footer.svelte";
  import GlobalStyles from "./GlobalStyles.svelte";

  // Stores
  import { pageState, pageTitle } from "./state/stores";

  let component;
  let params = {};
  let links = [];

  let title;

  afterUpdate(() => {
    const { app, appId, ping, metric, table } = params;

    links = [
      ...(app
        ? [
            { url: "/", name: "apps" },
            { url: `/apps/${app}/`, name: app },
          ]
        : []),
      ...(appId
        ? [{ url: `/apps/${app}/app_ids/${appId}/`, name: appId }]
        : []),
      ...(ping ? [{ url: `/apps/${app}/pings/${ping}/`, name: ping }] : []),
      ...(metric
        ? [
            {
              url: `/apps/${app}/metrics/${metric}/`,
              name: metric.replaceAll("-", "."),
            },
          ]
        : []),
      ...(table
        ? [
            {
              url: `/apps/${app}/app_ids/${appId}/tables/${table}/`,
              name: table,
            },
          ]
        : []),
    ];
  });

  function setComponent(c) {
    return function setComponentInner(ctx) {
      pageState.set(queryStringParse(ctx.querystring, { parseNumbers: true }));
      component = c;
      params = ctx.params;
    };
  }

  page("*", (ctx, next) => {
    ga("set", "page", ctx.page.current);
    ga("send", "pageview");
    next();
  });

  page("/", setComponent(AppList));
  page("/apps/:app/app_ids/:appId/tables/:table", setComponent(TableDetail));
  page("/apps/:app/app_ids/:appId", setComponent(AppIdDetail));
  page("/apps/:app/pings/:ping", setComponent(PingDetail));
  page("/apps/:app/metrics/:metric", setComponent(MetricDetail));
  page("/apps/:app", setComponent(AppDetail));

  page();

  // Set page title
  // https://stackoverflow.com/a/59028538

  $: title = $pageTitle ? `${$pageTitle}` : "Glean Dictionary";
  $: document.title = title;
</script>

<GlobalStyles />

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="app">
  <header>
    <div class="mzp-c-navigation">
      <div class="mzp-c-navigation-logo-glean">
        <a class="glean-logo" href="/">
          <img src="/glean_logo.png" alt="Glean Dictionary Logo" /></a
        >
        <a href="/"><h5>Dictionary</h5></a>
      </div>
    </div>
  </header>
  {#if links.length}
    <nav class="mzp-c-navigation breadcrumb">
      <Breadcrumb {links} />
    </nav>
  {/if}
  <main>
    <div class="mzp-l-content">
      <svelte:component this={component} bind:params />
    </div>
  </main>

  <Footer />
</div>

<style>
  .app {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 100%;
  }

  .mzp-c-navigation {
    background: $color-black;
    padding-top: $spacing-md;
    overflow-x: hidden;
    .mzp-c-navigation-logo-glean {
      margin-left: $spacing-xl;
      width: 100%;
      display: flex;
      padding-top: $spacing-xs;
      .glean-logo {
        text-decoration: none;
        img {
          max-width: 113px;
        }
      }
      h5 {
        display: inline-block;
        color: #e0e3e0;
        line-height: 0.7;
        padding-left: $spacing-xs;
        font-size: 38px;
      }
    }
  }

  .breadcrumb {
    top: 0;
    position: sticky;
    background: $color-light-gray-10;
    box-shadow: 1px 1px 1px rgba($color-black, 0.1);
    z-index: 1000;
  }

  .mzp-l-content {
    padding: $spacing-xl;
  }
</style>
