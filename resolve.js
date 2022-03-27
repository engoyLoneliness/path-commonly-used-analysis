const process = require('process');

// 对应keyCode
const CHAR_UPPERCASE_A = 65 /* A */,
  CHAR_LOWERCASE_A = 97 /* a */,
  CHAR_UPPERCASE_Z = 90 /* Z */,
  CHAR_LOWERCASE_Z = 122 /* z */,
  CHAR_DOT = 46 /* . */,
  CHAR_FORWARD_SLASH = 47 /* / */,
  CHAR_BACKWARD_SLASH = 92 /* \ */,
  CHAR_COLON = 58 /* : */,
  CHAR_QUESTION_MARK = 63; /* ? */

// 路径分隔符
function isPosixPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH;
}

/**
 * 规范化路径
 * 主要处理/和. 将路径处理成系统可识别的路径
 * @param {string} path 为规范的路径
 * @param {boolear} allowAboveRoot
 * @param {string} separator /
 * @param {function} isPosixPathSeparator 判断keycode
 * @returns 规范化后的路径
 */
function normalizeString(path, allowAboveRoot, separator, isPosixPathSeparator) {
  let res = '';
  let lastSegmentLength = 0; // 路径最后一个根后面的值得数量
  let lastSlash = -1; // 截取结束下标
  let dots = 0; // .的出现次数
  let code = 0; // keyCode值

  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) code = path.charCodeAt(i);
    else if (isPosixPathSeparator(code)) break;
    else code = CHAR_FORWARD_SLASH;
    if (isPosixPathSeparator(code)) {
      // 根目录匹配范围内的处理
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (dots === 2) {
        // 存在上层目录的路径 ../
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT
        ) {
          if (res.length > 2) {
            // 匹配到最后一个根出现的下标
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = '';
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length !== 0) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        // 根目录不存在
        if (allowAboveRoot) {
          res += res.length > 0 ? `${separator}..` : '..';
          lastSegmentLength = 2;
        }
      } else {
        // 主要处理 在这一步处理好路径
        if (res.length > 0) {
          res += `${separator}${path.slice(lastSlash + 1, i)}`;
          // 每次匹配到根，就会匹配并记录截取的开始和结束下标
        } else {
          res = path.slice(lastSlash + 1, i);
          lastSegmentLength = i - lastSlash - 1;
        }
      }
      // 每匹配到根目录符号就改变
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

const validateString = (value, name) => {
  if (typeof value !== 'string') throw new ERR_INVALID_ARG_TYPE(name, 'string', value);
};

function resolvePosix(...args) {
  let resolvedPath = '';
  let resolvedAbsolute = false;

  for (let i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    const path = i >= 0 ? args[i] : process.cwd();
    validateString(path, 'path');

    if (path.length === 0) {
      continue;
    }

    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = path.charCodeAt(0) === 47;
  }

  // 对拿到的路径处理
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, '/', isPosixPathSeparator);

  if (resolvedAbsolute) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : '.';
}

// resolvePosix('./1111', '../2222'); /Users/apple/Desktop/工作文件/article/2222
// resolvePosix('/');  for循环开关resolvedAbsolute值改变 直接返回 /
resolvePosix('./1111', '../2222');
