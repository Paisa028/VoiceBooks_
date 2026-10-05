// Decorative: one spoken sentence becoming a ledger line.
export default function LedgerSheet() {
  return (
    <figure className="ledger" aria-hidden="true">
      <p className="spoken">
        <span>"Paid Marlow Hardware 1,240 for shop fittings."</span>
      </p>
      <table>
        <thead>
          <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
        </thead>
        <tbody>
          <tr className="new">
            <td>2 Oct</td>
            <td>Marlow Hardware<small>Shop fittings</small></td>
            <td>−1,240.00</td>
          </tr>
          <tr>
            <td>1 Oct</td>
            <td>Diesel<small>Vehicle costs</small></td>
            <td>−685.40</td>
          </tr>
          <tr>
            <td>30 Sep</td>
            <td>Invoice 1042 paid<small>Sales</small></td>
            <td>+4,200.00</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}
