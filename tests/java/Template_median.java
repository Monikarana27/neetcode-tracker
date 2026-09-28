import java.util.*;

public class Template_median {
static class Median {
    PriorityQueue<Integer> low=new PriorityQueue<>(Comparator.reverseOrder());
    PriorityQueue<Integer> high=new PriorityQueue<>();
    void add(int x) {
        low.offer(x); high.offer(low.poll());
        if(high.size()>low.size()) low.offer(high.poll());
    }
    double value() {
        if(low.isEmpty()) throw new IllegalStateException();
        return low.size()>high.size()?low.peek():((long)low.peek()+high.peek())/2.0;
    }
}
}
