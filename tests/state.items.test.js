import { isExpired, isRemoved, isRecent } from "../src/state/items";

describe("checking if a date has expired", () => {
  it("returns True if input is 'never' or undefined", () => {
    expect(isExpired({ expires: "never" }) || isExpired({})).toEqual(false);
  });
  it("returns True if input is a date from the past", () => {
    expect(isExpired({ expires: "2021-01-01" })).toEqual(true);
  });
  it("returns False if input is a date from the future", () => {
    expect(isExpired({ expires: "3021-01-01" })).toEqual(false);
  });
});

describe("isRemoved works as expected", () => {
  it("returns true if in_source is false", () => {
    expect(isRemoved({ in_source: false })).toEqual(true);
  });
  it("returns false if in_source is undefined", () => {
    expect(isRemoved({})).toEqual(false);
  });
  it("returns false if in_source is true", () => {
    expect(isRemoved({ in_source: true })).toEqual(false);
  });
});

describe("checking if a date is recent", () => {
  it("returns True if it's less than 30 days ago", () => {
    expect(isRecent({ date_first_seen: new Date() })).toEqual(true);
  });
  it("returns False if more than 30 days have passed", () => {
    expect(isRecent({ date_first_seen: "2021-01-01 00:00:00" })).toEqual(false);
  });
});
