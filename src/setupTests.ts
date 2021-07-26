// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import pdw from "./PDW-Lib";

//untested. Probably wrong.
test("parsable date testing", () => {
  expect(pdw.isParsableDate("2021-04-02")).toBe(true);
  expect(pdw.isParsableDate("")).toBe(false);
  expect(pdw.isParsableDate("failing string")).toBe(false);
});
