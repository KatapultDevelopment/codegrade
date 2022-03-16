// Constants for defining ideal "readable" file
const IDEAL_COMMENT_RATIO = Object.freeze({ ABS_MIN: 0 / 100, IDEAL_MIN: 20 / 100, IDEAL_MAX: 50 / 100, ABS_MAX: 100 / 100 });
const IDEAL_VERTICAL_RATIO = Object.freeze({ ABS_MIN: 0 / 100, IDEAL_MIN: 20 / 100, IDEAL_MAX: 40 / 100, ABS_MAX: 100 / 100 });
const IDEAL_LINE_COUNT = Object.freeze({ IDEAL_MAX: 5000, ABS_MAX: 10000 });
const IDEAL_LINE_LENGTH = Object.freeze({ IDEAL_MAX: 160, ABS_MAX: 240 });

// Score points possible definition
const RUBRIC = Object.freeze({
  comments: 40,
  verticalSpace: 20,
  fileLength: 25,
  lineLength: 15
});

function gradeFile(document) {
  const metrics = getReadabilityMetrics(document);

  const score = calcReadabilityScores(metrics);

  return { metrics, score };
}

function getReadabilityMetrics(document) {
  let metrics = { totals: {}, ratios: {}, flags: {} };

  metrics.totals.lines = document.lineCount;
  metrics.flags.lineCountIsExcessive = metrics.totals.lines >= IDEAL_LINE_COUNT.ABS_MAX;

  const textLines = Array.from(Array(metrics.totals.lines).keys()).map(x => document.lineAt(x));
  metrics.totals.longestLine = Math.max(...textLines.map(x => x.text.length));
  metrics.flags.longestLineIsExcessive = metrics.totals.longestLine >= IDEAL_LINE_LENGTH.ABS_MAX;

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

// TODO (03-16-2022): This entire function can be simplified by making a unified config object
function calcReadabilityScores(metrics) {
  let score = {
    comments: {},
    verticalSpace: {},
    fileLength: {},
    lineLength: {},
    total: {}
  };

  let codeCommentRatio = metrics.totals.comments / (metrics.totals.codeLines || metrics.totals.lines);
  let commentCo = calcGradeCoefficient(codeCommentRatio, IDEAL_COMMENT_RATIO);
  score.comments = {
    ratio: commentCo,
    percent: `${Math.round(commentCo * 100)}%`,
    points: commentCo * RUBRIC.comments,
    fraction: `${Math.round(commentCo * RUBRIC.comments)} / ${RUBRIC.comments}`
  };
  
  let codeEmptyRatio = metrics.totals.emptyLines / (metrics.totals.codeLines || metrics.totals.lines);
  let vertCo = calcGradeCoefficient(codeEmptyRatio, IDEAL_VERTICAL_RATIO);
  score.verticalSpace = {
    ratio: vertCo,
    percent: `${Math.round(vertCo * 100)}%`,
    points: vertCo * RUBRIC.verticalSpace,
    fraction: `${Math.round(vertCo * RUBRIC.verticalSpace)} / ${RUBRIC.verticalSpace}`
  };

  let lengthCo = calcGradeCoefficient(metrics.totals.lines, IDEAL_LINE_COUNT);
  score.fileLength = {
    ratio: lengthCo,
    percent: `${Math.round(lengthCo * 100)}%`,
    points: lengthCo * RUBRIC.fileLength,
    fraction: `${Math.round(lengthCo * RUBRIC.fileLength)} / ${RUBRIC.fileLength}`
  };

  let lineCo = calcGradeCoefficient(metrics.totals.longestLine, IDEAL_LINE_LENGTH);
  score.lineLength = {
    ratio: lineCo,
    percent: `${Math.round(lineCo * 100)}%`,
    points: lineCo * RUBRIC.lineLength,
    fraction: `${Math.round(lineCo * RUBRIC.lineLength)} / ${RUBRIC.lineLength}`
  };

  score.total.points = Object.values(score).map(x => x.points ?? 0).reduce((t, x) => t += x, 0);
  const rubricTotal = Object.values(RUBRIC).reduce((t, x) => t += x, 0);
  console.log(`rubricTotal`, rubricTotal);
  console.log(`score.total.points`, score.total.points);
  score.total.ratio = score.total.points / rubricTotal;
  score.total.percent = `${Math.round(score.total.ratio * 100)}%`;
  score.total.fraction = `${score.total.points} / ${rubricTotal}`;

  return score;
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
  
