
const Snake = ({ snake }) => {
  return (
    <>
      {snake.map((segment, index) => (
        <div
          key={index}
          className="cell snake"
          style={{
            gridColumnStart: segment.x + 1,
            gridRowStart: segment.y + 1,
          }}
        />
      ))}
    </>
  );
};

export default Snake;
