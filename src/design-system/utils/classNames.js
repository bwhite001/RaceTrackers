/**
 * Utility for conditionally joining classNames together
 * Similar to the popular 'classnames' or 'clsx' libraries
 */

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Conditionally apply classes based on a condition
 * @param {boolean} condition - The condition to check
 * @param {string} trueClass - Class to apply if condition is true
 * @param {string} falseClass - Class to apply if condition is false
 */
export function conditionalClass(condition, trueClass, falseClass = '') {
  return condition ? trueClass : falseClass;
}

/**
 * Merge multiple class strings, removing duplicates
 * @param {...string} classes - Class strings to merge
 */
export function mergeClasses(...classes) {
  const classArray = classes
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter(Boolean);
  
  return [...new Set(classArray)].join(' ');
}

export default cn;
