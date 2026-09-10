import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import { getSessionUser } from "@/lib/getSessionUser";
import Order from "@/models/Order";
import { products } from "@/data/products";

export const runtime = "nodejs";

function createOrderNumber() {
  const date = new Date();

  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const randomPart = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `SJ-${datePart}-${randomPart}`;
}

function cleanText(value, maximumLength = 150) {
  return String(value || "").trim().slice(0, maximumLength);
}

export async function POST(request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in before checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: "Your shopping bag is empty." },
        { status: 400 }
      );
    }

    const shippingAddress = {
      addressLine1: cleanText(body.shippingAddress?.addressLine1),
      addressLine2: cleanText(body.shippingAddress?.addressLine2),
      city: cleanText(body.shippingAddress?.city, 80),
      state: cleanText(body.shippingAddress?.state, 80),
      pincode: cleanText(body.shippingAddress?.pincode, 6),
    };

    const phone = cleanText(body.phone, 10);

    if (
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !/^[1-9][0-9]{5}$/.test(shippingAddress.pincode) ||
      !/^[6-9][0-9]{9}$/.test(phone)
    ) {
      return NextResponse.json(
        { message: "Please enter a valid Indian delivery address." },
        { status: 400 }
      );
    }

    const verifiedItems = body.items.map((bagItem) => {
      const productId = String(bagItem.productId || "");
      const product = products.find(
        (item) => String(item.id) === productId
      );

      if (!product) {
        throw new Error("One of the products is unavailable.");
      }

      const size = cleanText(bagItem.size, 40);

      if (!product.sizes.includes(size)) {
        throw new Error(`Invalid size selected for ${product.name}.`);
      }

      const quantity = Math.min(
        10,
        Math.max(1, Number.parseInt(bagItem.quantity, 10) || 1)
      );

      const price = Number(product.price);
      const total = price * quantity;

      return {
        productId: String(product.id),
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        size,
        quantity,
        price,
        total,
      };
    });

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const shipping = 0;
    const total = subtotal + shipping;

    await connectMongoDB();

    const order = await Order.create({
      orderNumber: createOrderNumber(),
      userId: user.id,
      firebaseUid: user.firebaseUid,

      customer: {
        name: cleanText(body.name, 100),
        email: user.email,
        phone,
      },

      shippingAddress,
      items: verifiedItems,
      subtotal,
      shipping,
      total,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    return NextResponse.json(
      {
        message: "Order placed successfully.",
        orderNumber: order.orderNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);

    return NextResponse.json(
      {
        message: error.message || "Unable to place your order.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in to view your orders." },
        { status: 401 }
      );
    }

    await connectMongoDB();

    const orders = await Order.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map((order) => ({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        name: item.name,
        image: item.image,
        slug: item.slug,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error("Orders fetch error:", error);

    return NextResponse.json(
      { message: "Unable to load your orders." },
      { status: 500 }
    );
  }
}