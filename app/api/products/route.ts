import { NextRequest, NextResponse } from "next/server";
import { fetchCatalogProducts } from "@/lib/catalog";
import {
  filterProductsForSection,
  resolveProductSectionFromSlug,
  type ProductSection,
} from "@/lib/productLogic";
import { fetchProducts } from "@/lib/woocommerce";
import { fetchUsedPrinterProducts } from "@/lib/usedPrinters";
import type { ProductOrderType } from "@/lib/woocommerce-types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("per_page") ?? "12", 10);
    const search = searchParams.get("search") ?? undefined;
    const stock_status = searchParams.get("stock_status") ?? undefined;
    const orderby = searchParams.get("orderby") ?? undefined;
    const order = (searchParams.get("order") as "asc" | "desc" | null) ?? undefined;
    const category = searchParams.get("category");
    const categorySlug = searchParams.get("category_slug") ?? undefined;
    const productOrderType = searchParams.get("product_order_type");
    const sort = searchParams.get("sort") ?? undefined;
    const tag = searchParams.get("tag") ?? searchParams.get("promotion") ?? undefined;
    const exclude = searchParams.get("exclude");
    const usedPrinters = searchParams.get("used_printers");
    const section: ProductSection =
      usedPrinters === "1" || usedPrinters === "true"
        ? "used_printers"
        : productOrderType === "pre_order"
        ? "preorders"
        : resolveProductSectionFromSlug(categorySlug);

    const result =
      section === "used_printers"
        ? await fetchUsedPrinterProducts({
            page,
            perPage,
          })
        : search || category || orderby || order
        ? await fetchProducts({
            page,
            perPage,
            search,
            stock_status,
            orderby,
            order: order ?? undefined,
            category: category ? Number(category) : undefined,
            tag,
          })
        : await fetchCatalogProducts({
            page,
            perPage,
            categorySlug,
            orderType:
              productOrderType === "pre_order"
                ? (productOrderType as ProductOrderType)
                : undefined,
            sort,
            stockStatus: stock_status,
            tag,
          });

    const excludedId = exclude ? Number(exclude) : undefined;
    const sectionFilteredProducts = filterProductsForSection(result.data, section);
    const products = Number.isFinite(excludedId)
      ? sectionFilteredProducts.filter((product) => product.id !== excludedId)
      : sectionFilteredProducts;

    return NextResponse.json({
      products,
      pagination: {
        page,
        perPage,
        totalPages: result.totalPages,
        totalProducts: result.totalProducts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
