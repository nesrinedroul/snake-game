

const Food = ({ food }) => {
  return (
    <div
      className="cell food"
      style={{
        gridColumnStart: food.x + 1,
        gridRowStart: food.y + 1,
      }}
    />
  );
};

export default Food;
