import React from 'react';
import { logError } from '../utils/errorHandler';

/**
 * 错误边界组件
 * 捕获子组件中的JavaScript错误，记录错误并显示备用UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 以显示降级 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    const errorLog = logError(error, {
      errorInfo,
      props: this.props,
      componentStack: errorInfo.componentStack
    });

    // 更新状态以包含错误详情
    this.setState({
      error,
      errorInfo,
      eventId: errorLog.timestamp
    });
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义错误UI，使用它
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo);
        }
        return this.props.fallback;
      }

      // 默认错误UI
      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        eventId={this.state.eventId}
        onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
      />;
    }

    return this.props.children;
  }
}

/**
 * 默认错误回退组件
 */
const ErrorFallback = ({ error, errorInfo, eventId, onRetry }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
        {/* 错误图标 */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* 错误标题 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          出了点问题
        </h2>

        {/* 错误描述 */}
        <p className="text-gray-600 mb-6">
          抱歉，应用遇到了一个意外错误。我们已经记录了这个问题，正在修复中。
        </p>

        {/* 开发环境显示错误详情 */}
        {isDevelopment && error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">错误详情（仅开发环境显示）:</h3>
            <div className="text-xs text-red-700 font-mono">
              <p className="font-bold">{error.name}: {error.message}</p>
              {error.stack && (
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {error.stack}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* 错误ID */}
        {eventId && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">
              错误ID: <code className="font-mono">{eventId}</code>
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            重试
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            返回首页
          </button>
        </div>

        {/* 支持链接 */}
        <div className="mt-4">
          <p className="text-xs text-gray-500">
            如果问题持续存在，请{' '}
            <a 
              href="mailto:support@example.com" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              联系技术支持
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * HOC 用于包装组件并提供错误边界
 */
export const withErrorBoundary = (WrappedComponent, errorFallback) => {
  const WithErrorBoundaryComponent = (props) => (
    <ErrorBoundary fallback={errorFallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

/**
 * Hook 用于在函数组件中抛出错误到错误边界
 */
export const useErrorHandler = () => {
  return React.useCallback((error, errorInfo) => {
    // 记录错误
    logError(error, errorInfo);
    
    // 抛出错误到最近的错误边界
    throw error;
  }, []);
};

export default ErrorBoundary; 