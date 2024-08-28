"use server";

import { redirect } from "next/navigation";
import { parseWithZod } from "@conform-to/zod";
import { PostSchema, SiteCreationSchema, siteSchema } from "./utils/zodSchemas";
import dbConnect from "./utils/db";
import { requireUser } from "./utils/requireUser";
import { stripe } from "./utils/stripe";
import User from './models/User';
import Site from './models/Site';
import Post from './models/Post';
import Subscription from './models/Subscription';

export async function CreateSiteAction(prevState: any, formData: FormData) {
  await dbConnect();
  const user = await requireUser();

  const [subStatus, sites] = await Promise.all([
    Subscription.findOne({ userId: user.id }).select('status'),
    Site.find({ userId: user.id }),
  ]);

  if (!subStatus || subStatus.status !== "active") {
    if (sites.length < 1) {
      // Allow creating a site
      const submission = await parseWithZod(formData, {
        schema: SiteCreationSchema({
          async isSubdirectoryUnique() {
            const existingSubDirectory = await Site.findOne({
              subdirectory: formData.get("subdirectory") as string,
            });
            return !existingSubDirectory;
          },
        }),
        async: true,
      });

      if (submission.status !== "success") {
        return submission.reply();
      }

      const response = await Site.create({
        description: submission.value.description,
        name: submission.value.name,
        subdirectory: submission.value.subdirectory,
        userId: user.id,
      });

      return redirect("/dashboard/sites");
    } else {
      // user already has one site, don't allow
      return redirect("/dashboard/pricing");
    }
  } else if (subStatus.status === "active") {
    // User has an active plan, they can create sites...
    const submission = await parseWithZod(formData, {
      schema: SiteCreationSchema({
        async isSubdirectoryUnique() {
          const existingSubDirectory = await Site.findOne({
            subdirectory: formData.get("subdirectory") as string,
          });
          return !existingSubDirectory;
        },
      }),
      async: true,
    });

    if (submission.status !== "success") {
      return submission.reply();
    }

    const response = await Site.create({
      description: submission.value.description,
      name: submission.value.name,
      subdirectory: submission.value.subdirectory,
      userId: user.id,
    });
    return redirect("/dashboard/sites");
  }
}

export async function CreatePostAction(prevState: any, formData: FormData) {
  await dbConnect();
  const user = await requireUser();

  const submission = parseWithZod(formData, {
    schema: PostSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const data = await Post.create({
    title: submission.value.title,
    smallDescription: submission.value.smallDescription,
    slug: submission.value.slug,
    articleContent: JSON.parse(submission.value.articleContent),
    image: submission.value.coverImage,
    userId: user.id,
    siteId: formData.get("siteId") as string,
  });

  return redirect(`/dashboard/sites/${formData.get("siteId")}`);
}

export async function EditPostActions(prevState: any, formData: FormData) {
  await dbConnect();
  const user = await requireUser();

  const submission = parseWithZod(formData, {
    schema: PostSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const data = await Post.findOneAndUpdate(
    {
      userId: user.id,
      id: formData.get("articleId") as string,
    },
    {
      title: submission.value.title,
      smallDescription: submission.value.smallDescription,
      slug: submission.value.slug,
      articleContent: JSON.parse(submission.value.articleContent),
      image: submission.value.coverImage,
    },
    { new: true }
  );

  return redirect(`/dashboard/sites/${formData.get("siteId")}`);
}

export async function DeletePost(formData: FormData) {
  await dbConnect();
  const user = await requireUser();

  const data = await Post.findOneAndDelete({
    userId: user.id,
    id: formData.get("articleId") as string,
  });

  return redirect(`/dashboard/sites/${formData.get("siteId")}`);
}

export async function UpdateImage(formData: FormData) {
  await dbConnect();
  const user = await requireUser();

  const data = await Site.findOneAndUpdate(
    {
      userId: user.id,
      id: formData.get("siteId") as string,
    },
    {
      imageUrl: formData.get("imageUrl") as string,
    },
    { new: true }
  );

  return redirect(`/dashboard/sites/${formData.get("siteId")}`);
}

export async function DeleteSite(formData: FormData) {
  await dbConnect();
  const user = await requireUser();

  const data = await Site.findOneAndDelete({
    userId: user.id,
    id: formData.get("siteId") as string,
  });

  return redirect("/dashboard/sites");
}

export async function CreateSubscription() {
  await dbConnect();
  const user = await requireUser();

  let stripeUserId = await User.findOne({
    id: user.id,
  }).select('customerId email firstName');

  if (!stripeUserId?.customerId) {
    const stripeCustomer = await stripe.customers.create({
      email: stripeUserId?.email,
      name: stripeUserId?.firstName,
    });

    stripeUserId = await User.findOneAndUpdate(
      { id: user.id },
      { customerId: stripeCustomer.id },
      { new: true }
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeUserId.customerId as string,
    mode: "subscription",
    billing_address_collection: "auto",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    customer_update: {
      address: "auto",
      name: "auto",
    },
    success_url:
      process.env.NODE_ENV === "production"
        ? "https://blog-marshal.vercel.app/dashboard/payment/success"
        : "http://localhost:3000/dashboard/payment/success",
    cancel_url:
      process.env.NODE_ENV === "production"
        ? "https://blog-marshal.vercel.app/dashboard/payment/cancelled"
        : "http://localhost:3000/dashboard/payment/cancelled",
  });

  return redirect(session.url as string);
}
