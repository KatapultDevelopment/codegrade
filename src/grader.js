// Constants for defining ideal "readable" file
const IDEAL_COMMENT_RATIO = Object.freeze({ ABS_MIN: 0 / 100, IDEAL_MIN: 20 / 100, IDEAL_MAX: 50 / 100, ABS_MAX: 100 / 100 });
const IDEAL_VERTICAL_RATIO = Object.freeze({ ABS_MIN: 0 / 100, IDEAL_MIN: 20 / 100, IDEAL_MAX: 40 / 100, ABS_MAX: 100 / 100 });
const EXCESSIVE_LINE_COUNT = Object.freeze({ IDEAL_MAX: 5000, ABS_MAX: 10000 });
const EXCESSIVE_LINE_LENGTH = Object.freeze({ IDEAL_MAX: 160, ABS_MAX: 240 });

function gradeFile(document) {
  const metrics = getReadabilityMetrics(document);

  const score = calcReadabilityScore(metrics);
  const scorePercent = Math.round(score * 100);

  return { metrics, score, scorePercent };
}

function getReadabilityMetrics(document) {
  let metrics = { totals: {}, ratios: {}, flags: {} };

  metrics.totals.lines = document.lineCount;
  metrics.flags.lineCountIsExcessive = metrics.totals.lines >= EXCESSIVE_LINE_COUNT.IDEAL_MAX;

  const textLines = Array.from(Array(metrics.totals.lines).keys()).map(x => document.lineAt(x));
  metrics.totals.longestLine = Math.max(...textLines.map(x => x.text.length));
  metrics.flags.longestLineIsExcessive = metrics.totals.longestLine >= EXCESSIVE_LINE_LENGTH.IDEAL_MAX;

  metrics.totals.emptyLines = textLines.filter(x => x.isEmptyOrWhitespace).length;
  metrics.totals.comments = textLines.filter(lineHasCodeComment).length;
  metrics.totals.docComments = textLines.filter(lineHasJsdocComment).length;
  metrics.totals.codeLines = metrics.totals.lines - metrics.totals.emptyLines - metrics.totals.comments - metrics.totals.docComments;


  return metrics;
}

function lineHasCodeComment(line) {
  let trimmedLine = line.text.trim();
  let hasJsComment = trimmedLine.match(/\/\//) && trimmedLine.length > 3;
  let hasHtmlComment = trimmedLine.match(/<!--/) && trimmedLine.length > 8;

  return hasJsComment || hasHtmlComment;
}

function lineHasJsdocComment(line) {
  return line.text.match(/\/\*\*/) || line.text.match(/ \* /) || line.text.match(/ \*\//);
}

function calcReadabilityScore(metrics) {
  // let score = 1;
  let scoreParts = {
    comments: 40 / 100,
    verticalSpace: 20 / 100,
    fileLength: 20 / 100,
    lineLength: 20 / 100
  };

  let codeCommentRatio = metrics.totals.comments / (metrics.totals.codeLines || metrics.totals.lines);
  scoreParts.comments *= calcGradeCoefficient(codeCommentRatio, IDEAL_COMMENT_RATIO);
  
  let codeEmptyRatio = metrics.totals.emptyLines / (metrics.totals.codeLines || metrics.totals.lines);
  scoreParts.verticalSpace *= calcGradeCoefficient(codeEmptyRatio, IDEAL_VERTICAL_RATIO);

  console.log(scoreParts);

  return Object.values(scoreParts).reduce((sum, x) => sum += x, 0);
}

function calcGradeCoefficient(x, range) {
  // let isAboveMin, isBelowMax;
  let coefficient = 1;
  let diff = 0;
  let maxDiff = 0;
  
  if (range.IDEAL_MIN != null && range.IDEAL_MAX != null) {
    if (x < range.IDEAL_MIN) {
      diff = range.IDEAL_MIN - x;
      maxDiff = range.IDEAL_MIN - range.ABS_MIN;
    }
    else if (x > range.IDEAL_MAX) {
      diff = x - range.IDEAL_MAX;
      maxDiff = range.ABS_MAX - range.IDEAL_MAX;
    }
  }
  else if (range.IDEAL_MIN != null) {
    if (x < range.IDEAL_MIN) {
      diff = range.IDEAL_MIN - x;
      maxDiff = range.IDEAL_MIN - range.ABS_MIN;
    }
  }
  else if (range.IDEAL_MAX != null) {
    if (x > range.IDEAL_MAX) {
      diff = x - range.IDEAL_MAX;
      maxDiff = range.ABS_MAX - range.IDEAL_MAX;
    }
  }

  if (diff) coefficient = 1 - (diff / maxDiff);
  if (coefficient < 0) coefficient = 0;

  return coefficient;
}

module.exports = {
  gradeFile,
}
  
