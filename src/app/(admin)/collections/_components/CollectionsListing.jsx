import CollectionCard from "./CollectionCard";

export default function CollectionsListing({ collectionsListData, onUpdateCollection}) {

  return (
    <div className="w-full mx-auto ">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,0.4fr))] gap-5">
        {collectionsListData.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} onUpdateCollection={onUpdateCollection} />
        ))}
      </div>
    </div>
  );
}