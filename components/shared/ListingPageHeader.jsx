export default function ListingPageHeader({title}) {
  return(
    <div className="flex justify-center items-center">
      <h1 className="text-2xl text-primary font-semibold">{title}</h1>
    </div>
  );
}