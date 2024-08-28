import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "../components/dashboard/EmptyState";
import { connectToDatabase } from "../utils/db";
import { requireUser } from "../utils/requireUser";
import Image from "next/image";
import Defaultimage from "@/public/default.png";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Site, { ISite } from "../models/Site";
import Post, { IPost } from "../models/Post";
import { Types } from "mongoose";

type TransformedSite = Omit<ISite, "_id"> & { id: string };
type TransformedPost = Omit<IPost, "_id"> & { id: string };

type MongoDocument<T> = Omit<T, "_id"> & { _id: Types.ObjectId };

// Define a User type that includes the id property
type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

async function getData(
  userId: string
): Promise<{ sites: TransformedSite[]; articles: TransformedPost[] }> {
  await connectToDatabase();
  const [sitesResult, articlesResult] = await Promise.all([
    Site.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean<MongoDocument<ISite>[]>(),
    Post.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean<MongoDocument<IPost>[]>(),
  ]);

  const transformedSites = sitesResult.map((site: MongoDocument<ISite>) => {
    const { _id, ...rest } = site;
    return {
      ...rest,
      id: _id.toString(),
    } as TransformedSite;
  });

  const transformedArticles = articlesResult.map(
    (article: MongoDocument<IPost>) => {
      const { _id, ...rest } = article;
      return {
        ...rest,
        id: _id.toString(),
      } as TransformedPost;
    }
  );

  return { sites: transformedSites, articles: transformedArticles };
}

export default async function DashboardIndexPage() {
  const user = (await requireUser()) as User; // Cast the result to User type
  const { articles, sites } = await getData(user.id);
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5">Your Sites</h1>
      {sites.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {sites.map((item) => (
            <Card key={item.id}>
              <Image
                src={item.imageUrl ?? Defaultimage}
                alt={item.name}
                className="rounded-t-lg object-cover w-full h-[200px]"
                width={400}
                height={200}
              />
              <CardHeader>
                <CardTitle className="truncate">{item.name}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {item.description}
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/sites/${item.id}`}>
                    View Articles
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You don't have any sites created"
          description="You currently don't have any Sites. Please create some so that you can see them right here."
          href="/dashboard/sites/new"
          buttonText="Create Site"
        />
      )}

      <h1 className="text-2xl mt-10 font-semibold mb-5">Recent Articles</h1>
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {articles.map((item) => (
            <Card key={item.id}>
              <Image
                src={item.image ?? Defaultimage}
                alt={item.title}
                className="rounded-t-lg object-cover w-full h-[200px]"
                width={400}
                height={200}
              />
              <CardHeader>
                <CardTitle className="truncate">{item.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {item.smallDescription}
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/sites/${item.siteId}/${item.id}`}>
                    Edit Article
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You don't have any articles created"
          description="You currently don't have any articles created. Please create some so that you can see them right here"
          buttonText="Create Article"
          href="/dashboard/sites"
        />
      )}
    </div>
  );
}
