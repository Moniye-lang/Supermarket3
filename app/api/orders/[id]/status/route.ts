import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyAuth } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";
import pusher from "@/lib/pusher";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated!" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (status) {
      order.status = status;
      if (['delivered', 'picked_up', 'completed'].includes(status)) {
        order.fulfilled = true;
      } else {
        order.fulfilled = false;
      }
    }

    await order.save();

    // Push notification
    let title = 'Order Status Updated';
    let body = `Your order #${order._id} status is now ${order.status}.`;

    if (status === 'delivery_here') {
      title = '🚚 Rider Arrived!';
      body = `Your rider has arrived at your address with your order! Please collect it.`;
    } else if (status === 'ready_for_pickup') {
      title = '🛍️ Order Ready for Pickup!';
      body = `Your order is prepared and ready for pickup at the store!`;
    } else if (status === 'assigned') {
      title = '📦 Order In Progress';
      body = `A staff member has been assigned to prepare your order.`;
    } else if (status === 'delivered') {
      title = '✅ Order Delivered';
      body = `Your order #${order._id} has been marked as fully delivered. Thank you!`;
    }

    const clientUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || 'https://supermarket3.vercel.app';
    await sendPushToUser(order.customerId.toString(), title, body, `${clientUrl}/order`).catch(() => {});

    const updatedOrder = await Order.findById(order._id)
      .populate('items.productId')
      .populate('assignedToWorkerId', 'name role status phone')
      .populate('reassignmentHistory.assignedWorkerId', 'name role')
      .populate('reassignmentHistory.assignedBy', 'name role');

    // Trigger Pusher real-time events
    await pusher.trigger(`order-${order._id}`, 'orderUpdated', updatedOrder);
    await pusher.trigger(`order-${order._id}`, 'order:status', {
      orderId: order._id.toString(),
      status: order.status,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

