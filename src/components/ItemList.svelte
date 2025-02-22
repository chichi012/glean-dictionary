<script>
  import { chunk } from "lodash";
  import { Document } from "flexsearch";

  import { getItemURL } from "../state/urls";
  import { stripLinks } from "../formatters/markdown";

  import Pagination from "./Pagination.svelte";
  import FilterInput from "./FilterInput.svelte";
  import Markdown from "./Markdown.svelte";
  import Label from "./Label.svelte";

  import { filterUncollectedItems } from "../state/filter";
  import { isExpired, isRemoved } from "../state/items";
  import { pageState, updateURLState } from "../state/stores";
  import { getLibraryName } from "../formatters/library";
  import {
    getDeprecatedItemDescription,
    getExpiredItemDescription,
    getRemovedItemDescription,
    getLibraryDescription,
  } from "../data/help";

  let DEFAULT_ITEMS_PER_PAGE = 20;

  export let appName;
  export let items;
  export let itemType;
  export let tagDescriptions;

  export let showFilter = true;

  let filteredItems = items.filter((item) => !isExpired(item));
  let pagedItems;
  let paginated = true;
  let search;
  let showUncollected;
  let topElement;
  let scrollY;

  const searchIndex = new Document({
    tokenize: "forward",
    index: ["id", "type", "tags", "origin", "description"],
  });

  items.forEach((item) => {
    searchIndex.add({
      id: item.name,
      type: item.type,
      tags: item.tags,
      origin: item.origin,
      description: item.description,
    });
  });

  function getItemTypeSingular(pluralized) {
    // cut off the trailing 's'
    return pluralized.slice(0, -1);
  }

  function fullTextSearch(query, searchItems) {
    const results = [
      ...new Set(searchIndex.search(query).flatMap((match) => match.result)),
    ];
    return results.map((result) => {
      return searchItems.find((item) => item.name === result);
    });
  }

  function handleSearch(searchItems, text, expired) {
    const searchResult = text ? fullTextSearch(text, searchItems) : searchItems;
    return filterUncollectedItems(searchResult, expired);
  }

  function highlightSearch(text, query) {
    return query.length
      ? text.replace(
          new RegExp(query, "gi"),
          (match) => `<mark>${match}</mark>`
        )
      : text;
  }

  $: {
    showUncollected =
      $pageState.showUncollected === undefined
        ? true
        : $pageState.showUncollected;
    search = $pageState.search || "";
  }

  // update pagedItems when either pagination changes or search text changes
  // (above)
  $: {
    filteredItems = handleSearch(items, search, showUncollected);

    // update pagination
    const currentPage = $pageState.page || 1;
    const perPage = paginated ? DEFAULT_ITEMS_PER_PAGE : filteredItems.length;
    const chunkIndex = paginated ? currentPage - 1 : 0;
    pagedItems =
      filteredItems.length > 0
        ? chunk([...filteredItems], perPage)[chunkIndex]
        : [];
  }

  const updateSearch = (origin, type = undefined) => {
    updateURLState(
      type
        ? { search: origin, page: 1, itemType: type }
        : { search: origin, page: 1 },
      true
    );
    // reset scroll position if we've scrolled down
    if (scrollY > topElement.offsetTop) {
      window.scroll(0, topElement.offsetTop);
    }
  };
</script>

<svelte:window bind:scrollY />

<div bind:this={topElement}>
  {#if !items.length}
    <p>
      No {itemType} found matching specified criteria.
    </p>
  {:else}
    {#if itemType === "metrics"}
      <span class="expire-checkbox">
        <label>
          <input
            type="checkbox"
            bind:checked={showUncollected}
            on:change={() => {
              // the binding changes *after* this callback is called, so use
              // the inverse value
              updateURLState({ showUncollected: !showUncollected });
            }}
          />
          Show expired and removed metrics
        </label>
        <label>
          <input type="checkbox" bind:checked={paginated} />
          Paginate
        </label>
      </span>
    {/if}
    {#if showFilter}
      <FilterInput placeHolder="Search {itemType}" />
    {/if}
    <div class="item-browser">
      <table class="mzp-u-data-table">
        <!-- We have to do inline styling here to override Protocol CSS rules -->
        <!-- https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity -->
        <col width="35%" />
        <col
          width={itemType === "metrics" || itemType === "tags" ? "20%" : "65%"}
        />
        <col
          width={itemType === "metrics" || itemType === "tags" ? "45%" : "0"}
        />
        <thead>
          <tr>
            <th scope="col" style="text-align: center;">Name</th>
            {#if itemType === "metrics"}
              <th scope="col" style="text-align: center;">Type</th>
            {:else if itemType === "tags"}
              <th scope="col" style="text-align: center;">Metric Count</th>
            {/if}
            <th scope="col" style="text-align: center;">Description</th>
          </tr>
        </thead>
        <tbody>
          {#each pagedItems as item}
            <tr>
              <td>
                <div class="item-property">
                  {#if itemType === "tags"}
                    <Label
                      text={item.name}
                      on:click={updateSearch(item.name, "metrics")}
                      clickable
                    />
                  {:else}
                    <a href={getItemURL(appName, itemType, item.name)}
                      >{@html highlightSearch(item.name, search)}</a
                    >
                  {/if}
                  {#if item.origin && item.origin !== appName}
                    <Label
                      text={getLibraryName(item)}
                      description={getLibraryDescription(
                        getItemTypeSingular(itemType),
                        item.origin
                      )}
                      on:click={updateSearch(item.origin)}
                      clickable
                    />
                  {/if}
                  {#if item.tags}
                    {#each item.tags as tag}
                      <Label
                        text={tag}
                        description={stripLinks(tagDescriptions[tag])}
                        clickable
                        on:click={updateSearch(tag)}
                      />
                    {/each}
                  {/if}
                  {#if isRemoved(item)}
                    <Label
                      text="removed"
                      description={getRemovedItemDescription(
                        getItemTypeSingular(itemType)
                      )}
                    />
                  {:else if isExpired(item)}
                    <Label
                      text="expired"
                      description={getExpiredItemDescription(
                        getItemTypeSingular(itemType)
                      )}
                    />
                  {/if}
                  {#if item.deprecated}
                    <Label
                      text="deprecated"
                      description={getDeprecatedItemDescription(
                        getItemTypeSingular(itemType)
                      )}
                    />
                  {/if}
                </div>
              </td>
              {#if itemType === "metrics"}
                <td style="text-align: center;">
                  <div class="item-property">
                    <code>{@html highlightSearch(item.type, search)}</code>
                  </div>
                </td>
              {:else if itemType === "tags"}
                <td style="text-align: center;">
                  <div class="item-property">
                    {item.metric_count}
                  </div>
                </td>
              {/if}
              <td class="description">
                <div class="item-property" title={item.description}>
                  <Markdown text={highlightSearch(item.description, search)} />
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if filteredItems.length && paginated}
    <Pagination
      totalItems={filteredItems.length}
      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
    />
  {/if}
</div>

<style>
  .item-browser {
    a {
      text-decoration: none;
    }
  }

  .item-property {
    height: 50px;
    overflow-y: auto;
    margin: -0.25rem;
  }

  table {
    table-layout: fixed;
    width: 100%;
    background: $color-light-gray-05;
    border-collapse: collapse;
    margin: auto;

    thead {
      position: sticky;
      top: 0;
      background-color: $color-light-gray-05;
    }
    tr {
      td {
        word-wrap: break-word;
        border: 1px dotted $color-light-gray-30;
      }
      &:nth-child(odd) td {
        background: $color-light-gray-10;
      }
      &:hover td {
        background: rgba($color-link-hover, 0.1);
      }
      .description {
        @include text-body-sm;
      }
    }
  }
  .expire-checkbox {
    display: block;
    text-align: right;
    label {
      display: inline;
    }
  }
</style>
