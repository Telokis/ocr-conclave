export function fixMalformedJson(jsonString: string) {
  // Step 1: Replace newline characters within string values
  let fixedJson = jsonString.replace(/: "([^"\\]*(\\.[^"\\]*)*)"/g, function (match) {
    return match.replace(/\n/g, "\\n");
  });

  // Step 2: Replace single backslashes with double backslashes, except for already escaped characters
  fixedJson = fixedJson.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");

  // Explanation of the regex in Step 2:
  // (?<!\\)  : Negative lookbehind. Ensures the backslash is not preceded by another backslash
  // \\       : Matches a single backslash
  // (?!["\\/bfnrtu]) : Negative lookahead. Ensures the backslash is not followed by ", \, /, b, f, n, r, t, or u
  //                    These are all valid escape sequences in JSON

  // Step 3: Try to parse the fixed JSON
  return fixedJson;
}

export function canParseJson(jsonString: string) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

export function stringifyNoIndent(obj: any) {
  return JSON.stringify(obj, null, 1).replace(/^ +/gm, "");
}
