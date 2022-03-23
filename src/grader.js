// Scoring rubric master object
const RUBRIC = [
  {
    name: 'Comments',
    pointsPossible: 40,
    metric: 'ratios.commentsToCodeLines',
    gradeRange: { absMin: 0 / 100, idealMin: 20 / 100, idealMax: 50 / 100, absMax: 100 / 100 }
  },
  {
    name: 'Vertical Space',
    pointsPossible: 25,
    metric: 'ratios.emptyLinesToCodeLines',
    gradeRange: { absMin: 0 / 100, idealMin: 10 / 100, idealMax: 40 / 100, absMax: 100 / 100 }
  },
  {
    name: 'File Length',
    pointsPossible: 20,
    metric: 'counts.lines',
    gradeRange: { idealMax: 5000, absMax: 10000 }
  },
  {
    name: 'Line Length',
    pointsPossible: 15,
    metric: 'counts.longestLine',
    gradeRange: { idealMax: 160, absMax: 320 }
  }
];

function gradeFile(document) {
  const metrics = getReadabilityMetrics(document);

  const score = getScoreData(metrics);

  return { metrics, score };
}

function getReadabilityMetrics(document) {
  let counts = {}, ratios = {}, flags = {};

  counts.lines = document.lineCount;
  // flags.lineCountIsExcessive = counts.lines >= IDEAL_LINE_COUNT.ABS_MAX;

  const textLines = Array.from(Array(counts.lines).keys()).map(x => document.lineAt(x));
  counts.longestLine = Math.max(...textLines.map(x => x.text.length));
  // flags.longestLineIsExcessive = counts.longestLine >= IDEAL_LINE_LENGTH.ABS_MAX;

  counts.emptyLines = textLines.filter(x => x.isEmptyOrWhitespace).length;
  counts.comments = textLines.filter(lineHasCodeComment).length;
  counts.docComments = textLines.filter(lineHasJsdocComment).length;
  counts.codeLines = counts.lines - counts.emptyLines - counts.comments - counts.docComments;

  ratios.commentsToCodeLines = counts.comments / (counts.codeLines || counts.lines);
  ratios.emptyLinesToCodeLines = counts.emptyLines / (counts.codeLines || counts.lines);

  return { counts, ratios, flags };
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

function getScoreData(metrics) {
  let breakdown = [];

  for (const ITEM of RUBRIC) {
    const [group, metric] = ITEM.metric.split('.');
    const metricValue = metrics[group][metric];
    const gradeCoefficient = calcGradeCoefficient(metricValue, ITEM.gradeRange);

    const points = ITEM.pointsPossible * gradeCoefficient;
    const fraction = `${Math.round(points)} / ${ITEM.pointsPossible}`;
    const percent = `${Math.round(gradeCoefficient * 100)}%`;
    
    breakdown.push({ name: ITEM.name, points, formatted: { fraction, percent } });
  }

  const totalPointsPossible = RUBRIC.reduce((acc, x) => acc+= x.pointsPossible, 0);
  const totalPoints = breakdown.reduce((tot, x) => tot += x.points, 0);

  const total = {
    points: totalPoints,
    formatted: {
      fraction: `${Math.round(totalPoints)} / ${totalPointsPossible}`,
      percent: `${Math.round((totalPoints / totalPointsPossible) * 100)}%`
    }
  };

  return { total, breakdown };
}

function calcGradeCoefficient(x, range) {
  let coefficient = 1;
  let diff = 0;
  let maxDiff = 0;
  
  if (range.idealMin != null && range.idealMax != null) {
    if (x < range.idealMin) {
      diff = range.idealMin - x;
      maxDiff = range.idealMin - range.absMin;
    }
    else if (x > range.idealMax) {
      diff = x - range.idealMax;
      maxDiff = range.absMax - range.idealMax;
    }
  }
  else if (range.idealMin != null) {
    if (x < range.idealMin) {
      diff = range.idealMin - x;
      maxDiff = range.idealMin - range.absMin;
    }
  }
  else if (range.idealMax != null) {
    if (x > range.idealMax) {
      diff = x - range.idealMax;
      maxDiff = range.absMax - range.idealMax;
    }
  }

  // Linear scale: coefficient = 1 - (diff / maxDiff);
  // if (diff) coefficient = 1 - (diff / maxDiff);

  // Quadratic scale: coefficient = -((diff / maxDiff) ** 2) + 1;
  if (diff) coefficient = -((diff / maxDiff) ** 2) + 1;
  if (coefficient < 0) coefficient = 0;

  return coefficient;
}

module.exports = {
  gradeFile,
}
  
