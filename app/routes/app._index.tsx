import { useEffect, useState } from "react";
import prisma from "../db.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { getToast, redirectWithError, redirectWithSuccess } from "remix-toast";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  LegacyCard,
  ResourceList,
  Avatar,
  ResourceItem,
  MediaCard,
  DataTable,
  InlineGrid,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { Review } from "@prisma/client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.rest.resources.Shop.all({
    session: session,
    fields: "id",
  });
  console.log(response);

  const reviews = await prisma.review.findMany({
    where: {
      shopId: response.data[0].id?.toString(),
    },
  });
  console.log(reviews);

  return json({reviews});
  // return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const formData = await args.request.formData();
  const { _action, ...values } = Object.fromEntries(formData);
  // const _action = formData.get("_action");

  if (_action === "REPLY") {
    return Reply(values);
  }

  if (_action === "DELETE") {
    return DeleteReview(values);
  }

  if (_action === "VISIBILITY") {
    return ReviewStatus(values);
  }
};

async function Reply(values: any) {
  try {
    await prisma.review.update({
      where: {
        id: values.reviewId,
      },
      data: {
        reply: values.content,
      },
    });
    return null;
  } catch (error) {
    return json({ error: `something went wrong` }, { status: 500 });
  }
}

async function DeleteReview(values: any) {
  try {
    // const { admin, session } = await authenticate.admin(request);
    // const response = await admin.rest.resources.Shop.all({
    //   session: session,
    // });
    // const form_data = await args.request.formData();
    // const reviewId =  form_data.get("reviewId")
    // // const shopId = formData.get("shopId")?.toString() as string;
    // // if (shopId === response.data[0].id?.toString()) {
    await prisma.review.delete({
      where: {
        id: values.reviewId,
      },
    });
    return null;
    // }
    // else {
    //   return json({ error: `Not Authorized` }, { status: 400 });
    // }
  } catch (error) {
    console.log(error);
    return json(
      { msg: `something went wrong`, error: JSON.stringify(error) },
      { status: 500 }
    );
  }
}

async function ReviewStatus(values: any) {
  try {
    await prisma.review.update({
      where: {
        id: values.reviewId,
      },
      data: {
        status: values.status,
      },
    });
    return null;
  } catch (error) {
    return json({ error: `something went wrong` }, { status: 500 });
  }
}

export default function Index() {
  const [visibleReply, setvisibleReply] = useState<any>({});
  const nav = useNavigation();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  // useEffect(() => {}, []);
  // const generateProduct = () => submit({}, { replace: true, method: "POST" });

  const data = useLoaderData<typeof loader>();
  console.log(data);
  const toggleItem = (itemId: any) => {
    setvisibleReply((prev: any) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };
  return (
    <Page>
      <BlockStack gap="500">
        {data.reviews?.map((review) => (
          <>
            <Card>
              <InlineStack align="space-between" wrap={false}>
                <div>
                  <Text as="h5" variant="bodyMd" fontWeight="semibold">
                    {review.userName}
                  </Text>
                  <Text as="p" variant="bodyXs">
                    {review.userEmail}
                  </Text>
                </div>
                <div>
                  <Text as="h5" variant="bodySm">
                    Product: {review.productId}
                  </Text>
                  <Text as="h4" variant="bodySm">
                    Rating: {review.rating}
                  </Text>
                </div>
              </InlineStack>

              <Text as="p" variant="bodyMd">
                {review.title}
              </Text>
              <Text as="p" variant="bodyMd">
                {review.content}
              </Text>
              {review.reply == "" ? (
                <>
                  <Button variant="plain" onClick={() => toggleItem(review.id)}>
                    Reply
                  </Button>
                </>
              ) : (
                <Form>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Reply:
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {review.reply}
                  </Text>
                </Form>
              )}

              {visibleReply[review.id] && review.reply == "" ? (
                <>
                  <Form method="POST">
                    <input type="hidden" name="reviewId" value={review.id} />

                    <textarea
                      name="content"
                      draggable={false}
                      // value={value}
                      // onChange={}
                    />
                    <button type="submit" name="_action" value="REPLY">
                      Reply
                    </button>
                  </Form>
                </>
              ) : (
                ""
              )}
              <InlineStack align="end" gap={"025"} wrap={false}>
                {review.status === "PUBLIC" ? (
                  <>
                    <Form method="POST">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="status" value="HIDDEN" />

                      <button type="submit" name="_action" value={"VISIBILITY"}>
                        <Button variant="plain" tone="critical">
                          Hide Review
                        </Button>
                      </button>
                    </Form>
                  </>
                ) : (
                  <>
                    <Form method="POST">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="status" value="PUBLIC" />

                      <button type="submit" name="_action" value={"VISIBILITY"}>
                        <Button variant="plain">Public Review</Button>
                      </button>
                    </Form>
                  </>
                )}
                <Form method="POST">
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="shopId" value={review.shopId} />

                  <button type="submit" name="_action" value={"DELETE"}>
                    <Button variant="plain" tone="critical">
                      Delete
                    </Button>
                  </button>
                </Form>
              </InlineStack>
            </Card>
          </>
        ))}
      </BlockStack>
    </Page>
  );
}
