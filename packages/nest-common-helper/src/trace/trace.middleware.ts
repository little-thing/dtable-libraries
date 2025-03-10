import { logger } from '@blastz/logger';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import { ExceptionMeta } from '../exception/index.js';
import { traceContext } from './trace-context.js';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * 追踪中间件
 * 用于记录请求的追踪信息，包括请求ID、请求元数据、响应时间等
 * 支持 HTTP、WebSocket 和 RPC 请求
 */
export class TraceMiddleware implements NestMiddleware {
  /**
   * 获取请求URL
   * @param request 请求对象
   * @returns 请求URL
   */
  private getRequestUrl(request: any) {
    if (request.route) {
      return request.route.path;
    }

    // WebSocket和RPC请求
    if (request.eventName) {
      return request.eventName;
    }

    return 'unknown';
  }

  /**
   * 获取HTTP请求元数据
   * @param request Express请求对象
   * @returns HTTP请求元数据
   */
  private getHttpRequestMetadata(request: Request) {
    const reqUrl = this.getRequestUrl(request);

    return {
      reqType: 'http',
      reqMethod: request.method,
      reqUrl,
      reqBody: request.body,
      reqIp: request.ip,
      reqIps: request.ips,
      referer: request.headers.referer,
      userAgent: request.headers['user-agent'],
    };
  }

  /**
   * 获取WebSocket请求元数据
   * @param socket WebSocket客户端对象
   * @param data 请求数据
   * @returns WebSocket请求元数据
   */
  private getWsRequestMetadata(socket: any, data: any) {
    const reqUrl = this.getRequestUrl(socket);

    return {
      reqType: 'ws',
      reqUrl,
      reqBody: data,
    };
  }

  /**
   * 获取RPC请求元数据
   * @param context RPC上下文
   * @param data 请求数据
   * @returns RPC请求元数据
   */
  private getRpcRequestMetadata(context: any, data: any) {
    const reqUrl = this.getRequestUrl(context);
    const metadata = context.getMap ? context.getMap() : undefined;

    return {
      reqType: 'rpc',
      reqUrl,
      reqBody: data,
      metadata,
    };
  }

  /**
   * 获取请求元数据
   * @param request 请求对象
   * @returns 请求元数据
   */
  private getRequestMetadata(request: any) {
    // 检查是否为Express请求
    if (request.headers && request.get) {
      return this.getHttpRequestMetadata(request);
    }

    // 检查是否为WebSocket请求
    if (request.handshake) {
      return this.getWsRequestMetadata(request, request.data);
    }

    // 检查是否为RPC请求
    if (request.getMap) {
      return this.getRpcRequestMetadata(request, request.data);
    }

    return {};
  }

  /**
   * 获取请求ID
   * @param request 请求对象
   * @param response 响应对象
   * @returns 请求ID
   */
  private getRequestId(request: any, response?: Response) {
    // HTTP请求
    if (request.headers && response) {
      if (!request.headers[REQUEST_ID_HEADER]) {
        request.headers[REQUEST_ID_HEADER] = uuid();
      }

      const requestId = request.headers[REQUEST_ID_HEADER];
      response.setHeader(REQUEST_ID_HEADER, requestId);

      return requestId;
    }

    // WebSocket请求
    if (request.handshake) {
      const data = request.data;

      if (!data) {
        return uuid();
      }

      if (!data.headers) {
        data.headers = {};
      }

      let requestId = data.headers[REQUEST_ID_HEADER];

      if (!requestId) {
        requestId = uuid();
        data.headers[REQUEST_ID_HEADER] = requestId;
      }

      return requestId;
    }

    // RPC请求
    if (request.getMap) {
      if (!request.getMap) {
        return uuid();
      }

      const metadata = request.getMap();
      return metadata[REQUEST_ID_HEADER] || uuid();
    }

    return uuid();
  }

  /**
   * 获取响应时间
   * @param startTime 开始时间
   * @returns 响应时间字符串
   */
  private getResTime(startTime: bigint) {
    const endTime = process.hrtime.bigint();
    const duration = (endTime - startTime) / BigInt(1000) / BigInt(1000);

    return `${duration}ms`;
  }

  /**
   * 中间件实现
   * @param request 请求对象
   * @param response 响应对象
   * @param next 下一个中间件函数
   */
  use(request: any, response: Response, next: NextFunction) {
    const requestMetadata = this.getRequestMetadata(request);
    const requestId = this.getRequestId(request, response);

    return traceContext.run({ requestId }, () => {
      const startTime = process.hrtime.bigint();

      logger.child(requestMetadata).trace('request in');

      // 包装next函数以捕获错误
      const wrappedNext = (error?: any) => {
        if (error) {
          error.meta = {
            resTime: this.getResTime(startTime),
            requestId,
          } satisfies ExceptionMeta;

          next(error);
        } else {
          const resTime = this.getResTime(startTime);
          logger.child({ resTime }).trace('request out');
          next();
        }
      };

      try {
        next(wrappedNext);
      } catch (error: any) {
        error.meta = {
          resTime: this.getResTime(startTime),
          requestId,
        } satisfies ExceptionMeta;

        next(error);
      }
    });
  }
}
