import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { propagationContext } from './propagation-context.js';

/**
 * 传播中间件
 * 用于在请求处理过程中传播上下文信息（如请求头）
 * 支持 HTTP、WebSocket 和 RPC 请求
 */
export class PropagationMiddleware implements NestMiddleware {
  /**
   * 从HTTP请求中获取头信息
   * @param request Express请求对象
   * @returns 请求头信息
   */
  private getHttpHeaders(request: Request) {
    return request.headers;
  }

  /**
   * 从WebSocket请求中获取头信息
   * @param socket WebSocket客户端对象
   * @param data 请求数据
   * @returns WebSocket头信息
   */
  private getWsHeaders(socket: any, data: any) {
    const headers = socket.handshake?.headers || {};

    if (data?.headers) {
      return {
        ...headers,
        ...data.headers,
      };
    }

    return headers;
  }

  /**
   * 从RPC请求中获取元数据
   * @param context RPC上下文
   * @returns RPC元数据
   */
  private getRpcHeaders(context: any) {
    const metadata = context.getMap ? context.getMap() : {};

    return metadata;
  }

  /**
   * 获取请求头信息
   * 根据请求类型返回对应的头信息
   * @param request 请求对象
   * @returns 头信息
   */
  private getHeaders(request: any) {
    // 检查是否为Express请求
    if (request.headers && request.get) {
      return this.getHttpHeaders(request);
    }

    // 检查是否为WebSocket请求
    if (request.handshake) {
      return this.getWsHeaders(request, request.data);
    }

    // 检查是否为RPC请求
    if (request.getMap) {
      return this.getRpcHeaders(request);
    }

    return {};
  }

  /**
   * 中间件实现
   * 将请求头信息存储在异步上下文中，并传播给后续的处理程序
   * @param request 请求对象
   * @param response 响应对象
   * @param next 下一个中间件函数
   */
  use(request: any, response: Response, next: NextFunction) {
    return propagationContext.run(
      { headers: this.getHeaders(request) },

     async () => {
        await next();
      },
    );
  }
}
