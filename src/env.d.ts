/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    suspend(promise: Promise<string>): number;
  }
}
